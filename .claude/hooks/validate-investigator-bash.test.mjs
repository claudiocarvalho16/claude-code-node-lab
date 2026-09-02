#!/usr/bin/env node
// Executable-contract tests for validate-investigator-bash.mjs.
//
// These tests run the validator as a real child process, feeding it JSON on
// stdin exactly as Claude Code's PreToolUse hook runner would, and assert on
// its exit code, stdout, and stderr. No internal function of the validator is
// imported, and the validator itself is never modified or refactored to ease
// testing — the goal is to pin down the hook's actual executable contract,
// not its implementation.
//
// Uses only native Node.js APIs: node:test, node:assert, node:child_process.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolved relative to this test file, not the current working directory.
const VALIDATOR_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'validate-investigator-bash.mjs',
);

const N1 = 'failure-investigator-n1';
const N2 = 'failure-investigator-n2';

// ---- helpers ---------------------------------------------------------

/**
 * Builds a PreToolUse hook payload. Any field can be overridden, and
 * `omitToolInput` drops `tool_input` entirely, to exercise the validator's
 * own input-validation branches.
 */
function payload({
  hookEventName = 'PreToolUse',
  toolName = 'Bash',
  agentType,
  command,
  omitToolInput = false,
} = {}) {
  const body = {
    hook_event_name: hookEventName,
    tool_name: toolName,
  };
  if (agentType !== undefined) body.agent_type = agentType;
  if (!omitToolInput) body.tool_input = { command };
  return JSON.stringify(body);
}

/** Runs the validator as a real process with the given raw stdin text. */
function runRaw(stdinText) {
  return spawnSync(process.execPath, [VALIDATOR_PATH], {
    input: stdinText,
    encoding: 'utf8',
  });
}

/** Runs the validator with a well-formed PreToolUse payload for one command. */
function run({ command, agentType, hookEventName, toolName, omitToolInput }) {
  return runRaw(payload({ command, agentType, hookEventName, toolName, omitToolInput }));
}

function assertPassThrough(result, label) {
  assert.strictEqual(
    result.status,
    0,
    `expected exit 0 for ${label}, got ${result.status} (stderr: ${result.stderr})`,
  );
  assert.strictEqual(
    result.stdout,
    '',
    `expected empty stdout (pass-through) for ${label}, got: ${result.stdout}`,
  );
  assert.strictEqual(result.stderr, '', `expected empty stderr for ${label}, got: ${result.stderr}`);
}

function assertDecision(result, label, decision) {
  assert.strictEqual(
    result.status,
    0,
    `expected exit 0 for ${label}, got ${result.status} (stderr: ${result.stderr})`,
  );
  assert.strictEqual(result.stderr, '', `expected empty stderr for ${label}, got: ${result.stderr}`);
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    assert.fail(`expected JSON stdout for ${label}, got: ${result.stdout}`);
  }
  assert.strictEqual(
    parsed.hookSpecificOutput.hookEventName,
    'PreToolUse',
    `unexpected hookEventName for ${label}`,
  );
  assert.strictEqual(
    parsed.hookSpecificOutput.permissionDecision,
    decision,
    `expected permissionDecision "${decision}" for ${label}, got: ${result.stdout}`,
  );
  assert.strictEqual(
    typeof parsed.hookSpecificOutput.permissionDecisionReason,
    'string',
    `expected a permissionDecisionReason string for ${label}`,
  );
}

function assertInternalFailure(result, label) {
  assert.strictEqual(result.status, 2, `expected exit 2 for ${label}, got ${result.status}`);
  assert.strictEqual(result.stdout, '', `expected empty stdout for ${label}, got: ${result.stdout}`);
  assert.ok(result.stderr.trim().length > 0, `expected non-empty stderr for ${label}`);
}

// ---- PASS_THROUGH — N1/N2 ---------------------------------------------

describe('PASS_THROUGH for N1/N2', () => {
  const commands = [
    'git status',
    'git diff',
    'npm test',
    'npm test -- -u',
    'npm run test:e2e',
    'npm run lint',
    'npm run lint -- --fix',
    'npm run build',
    'find src -name "*.ts"',
    'env',
    'node --version',
  ];

  for (const agentType of [N1, N2]) {
    for (const command of commands) {
      test(`${agentType}: "${command}" passes through`, () => {
        const result = run({ command, agentType });
        assertPassThrough(result, `${agentType} / "${command}"`);
      });
    }
  }
});

// ---- ASK ----------------------------------------------------------------

describe('ASK', () => {
  const commands = [
    'git branch --show-current',
    'git add .',
    'npm install some-package',
    'rm file.txt',
    'env FOO=bar npm test',
    'find . -exec rm {} +',
    'find . -delete',
    'npm test > output.txt',
    'git status && git log -5',
    'git status\ngit log -5',
    'git status\r\ngit log -5',
  ];

  for (const command of commands) {
    test(`${JSON.stringify(command)} asks for authorization`, () => {
      const result = run({ command, agentType: N1 });
      assertDecision(result, `N1 / ${JSON.stringify(command)}`, 'ask');
    });
  }
});

// ---- DENY -----------------------------------------------------------------

describe('DENY', () => {
  const commands = [
    'git commit --dry-run',
    'git push',
    'git pull',
    'git merge main',
    'git rebase main',
    'git reset --hard',
    'git restore .',
    'git clean -fd',
  ];

  for (const command of commands) {
    test(`"${command}" is denied`, () => {
      const result = run({ command, agentType: N1 });
      assertDecision(result, `N1 / "${command}"`, 'deny');
    });
  }

  test('DENY takes precedence over composition: "npm test\\ngit push origin main"', () => {
    const command = 'npm test\ngit push origin main';
    const result = run({ command, agentType: N2 });
    assertDecision(result, `N2 / ${JSON.stringify(command)}`, 'deny');
  });
});

// ---- agent scope ----------------------------------------------------------

describe('agent scope', () => {
  // A command that would DENY for N1/N2, used to prove the validator does
  // not interfere at all for callers it does not manage.
  const dangerousCommand = 'git commit --dry-run';

  test('no agent_type: validator does not interfere', () => {
    const result = run({ command: dangerousCommand });
    assertPassThrough(result, 'no agent_type');
  });

  test('agent_type "some-future-agent": validator does not interfere', () => {
    const result = run({ command: dangerousCommand, agentType: 'some-future-agent' });
    assertPassThrough(result, 'agent_type: some-future-agent');
  });
});

// ---- internal failures ------------------------------------------------

describe('internal failures', () => {
  test('invalid JSON -> exit 2', () => {
    const result = runRaw('{not valid json');
    assertInternalFailure(result, 'invalid JSON');
  });

  test('missing tool_input.command -> exit 2', () => {
    const result = run({ agentType: N1, omitToolInput: true });
    assertInternalFailure(result, 'missing tool_input.command');
  });

  test('wrong hook_event_name -> exit 2', () => {
    const result = run({ command: 'git status', agentType: N1, hookEventName: 'PostToolUse' });
    assertInternalFailure(result, 'wrong hook_event_name');
  });

  test('wrong tool_name -> exit 2', () => {
    const result = run({ command: 'git status', agentType: N1, toolName: 'Read' });
    assertInternalFailure(result, 'wrong tool_name');
  });
});

// ---- regressions ------------------------------------------------------
// Each test here pins a specific bug class found while reviewing the
// validator. They must fail loudly if a future edit to the validator
// reopens the gap; this file never imports or refactors the validator to
// make that possible, so these run against its real stdin/stdout contract.

describe('regressions', () => {
  test('a dangerous tail command after a newline is never PASS_THROUGH', () => {
    // "npm test" alone would pass through; appending a second line must not
    // silently inherit that approval.
    const command = 'npm test\ngit add .';
    const result = run({ command, agentType: N1 });
    assertDecision(result, `N1 / ${JSON.stringify(command)}`, 'ask');
  });

  test('a dangerous tail command after a CRLF newline is never PASS_THROUGH', () => {
    const command = 'npm test\r\ngit add .';
    const result = run({ command, agentType: N1 });
    assertDecision(result, `N1 / ${JSON.stringify(command)}`, 'ask');
  });

  test('"env" launching another command with an assignment is never PASS_THROUGH', () => {
    const command = 'env FOO=bar npm test';
    const result = run({ command, agentType: N1 });
    assertDecision(result, `N1 / "${command}"`, 'ask');
  });

  test('"env" launching a shell directly is never PASS_THROUGH', () => {
    const command = 'env bash -c "echo hi"';
    const result = run({ command, agentType: N1 });
    assertDecision(result, `N1 / "${command}"`, 'ask');
  });

  describe('find write-actions are never PASS_THROUGH', () => {
    const commands = [
      'find . -delete',
      'find . -exec rm {} +',
      'find . -execdir ls {} +',
      'find . -ok rm {} +',
      'find . -okdir rm {} +',
      'find . -fprintf fmt out.txt',
      'find . -fprint0 out.txt',
      'find . -fprint out.txt',
      'find . -fls out.txt',
    ];

    for (const command of commands) {
      test(`"${command}"`, () => {
        const result = run({ command, agentType: N1 });
        assertDecision(result, `N1 / "${command}"`, 'ask');
      });
    }
  });

  describe('redirection appended to a recognized command is never PASS_THROUGH', () => {
    const commands = [
      'npm test > output.txt',
      'git status > out.txt',
      'npm run lint >> lint.log',
      'npm run build > build.log',
    ];

    for (const command of commands) {
      test(`"${command}"`, () => {
        const result = run({ command, agentType: N1 });
        assertDecision(result, `N1 / "${command}"`, 'ask');
      });
    }
  });
});
