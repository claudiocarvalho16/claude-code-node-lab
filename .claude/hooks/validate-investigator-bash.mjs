#!/usr/bin/env node
// PreToolUse validator for Bash calls made by failure-investigator-n1 / failure-investigator-n2.
//
// Policy: these agents may run Bash for investigation, observation, and controlled
// reproduction of failures. That can include local, reversible effects — build
// output, coverage/cache artifacts, updated snapshots, lint --fix, or other
// artifacts needed to test a hypothesis. This hook controls autonomy, not all
// mutation: a small, explicit set of Git operations that rewrite history, discard
// changes, or affect the remote is always denied; a small, explicit set of
// recognized investigation commands is granted autonomy; everything else requires a
// human decision (ASK).
//
// Classification order:
//   1. explicit DENY         -> deny
//   2. ambiguous composition -> ask
//   3. explicit PASS_THROUGH -> pass
//   4. fallback              -> ask
//
// Output contract:
//   - PASS_THROUGH -> exit 0, empty stdout (pass-through, no permissionDecision is
//     emitted so normal Claude Code permissions still apply)
//   - DENY         -> exit 0, stdout: {"hookSpecificOutput": {..., "permissionDecision": "deny", ...}}
//   - ASK          -> exit 0, stdout: {"hookSpecificOutput": {..., "permissionDecision": "ask", ...}}
//   - validator itself failed -> exit 2, short message on stderr, no stdout

// This validator is scoped to the two failure-investigator agents. It is intended to
// run as a project-level hook (project settings PreToolUse), which receives every
// Bash call in the session, not just theirs — so any call whose `agent_type` isn't one
// of these two is not this validator's responsibility and must pass through untouched
// (exit 0, empty stdout), regardless of what the command itself looks like. This
// includes the main thread (no `agent_type` at all) and any other agent, built-in or
// custom. A missing `agent_type` is an expected, valid case here, not an error.
const MANAGED_AGENT_TYPES = new Set(['failure-investigator-n1', 'failure-investigator-n2']);

const DENY_REASON =
  'Failure investigators cannot run Git operations that rewrite history, discard changes, or affect the remote (commit, push, pull, merge, rebase, reset, restore, clean).';
const ASK_REASON =
  'This command is not in the recognized investigation allowlist, so it requires explicit authorization before running.';

// Git operations that rewrite history, discard changes, or touch the remote. This is
// a small, explicit set of hard boundaries. Everything else — other git subcommands,
// dependency installs, filesystem commands, process/service control, sed -i, tee,
// etc. — is intentionally left out of this list and falls through to the ASK
// fallback instead of being denied outright, since local reversible changes can be a
// legitimate part of an investigation. Output redirection (>, >>) is handled
// separately, in hasFileRedirection: it is likewise not denied, but it also
// disqualifies an otherwise-recognized command from PASS_THROUGH (see
// isRecognizedDiagnostic), so it still lands on ASK rather than being silently
// auto-approved.
const DENY_WORD_PATTERNS = [
  /\bgit\s+(commit|push|pull|merge|rebase|reset|restore|clean)\b/,
];

// Single, non-composed commands recognized as normal investigation steps and granted
// autonomy, even when they may produce local reversible artifacts (build output,
// caches, updated snapshots, lint fixes, ...). Matched against the whole (trimmed)
// command, so compositions like "git status && git log" are never matched here even
// though both sides look safe individually.
const PASS_THROUGH_PATTERNS = [
  /^git\s+(status|diff|log|show)\b/,
  /^npm\s+test\b/,
  /^npm\s+run\s+test\S*\b/,
  /^npm\s+run\s+lint\b/,
  /^npm\s+run\s+build\b/,
  // find is diagnostic unless it uses an action that executes a command or writes
  // output on find's own behalf (delete, exec/execdir, ok/okdir, fprint variants).
  /^find\b(?!.*-(delete|execdir|exec|okdir|ok|fprintf|fprint0|fprint|fls)\b)/,
  /^(pwd|ls|cat|head|tail|grep|which|type|printenv|ps|ss)\b/,
  // env is diagnostic only when used bare to print the environment; env used to
  // launch another command (e.g. "env FOO=bar npm test", "env bash -c ...") is not.
  /^env\s*$/,
  /^node\s+(--version|-v)\s*$/,
  /^npm\s+(--version|-v)\s*$/,
  /^git\s+--version\s*$/,
];

// Replaces the contents of quoted strings with spaces (same length, to keep offsets
// stable) so that keywords or operators inside quoted arguments/messages don't affect
// classification, e.g. git commit -m "reset the counter".
function stripQuoted(command) {
  return command.replace(/'[^']*'|"[^"]*"/g, (match) => ' '.repeat(match.length));
}

function isKnownMutation(strippedCommand) {
  return DENY_WORD_PATTERNS.some((pattern) => pattern.test(strippedCommand));
}

// Detects "> file" / ">> file" style redirection while ignoring numeric comparisons
// (">="), fd duplication (">&2", "2>&1") and arrows ("->"). Redirection is not denied
// outright — capturing output to a file can be a legitimate way to observe a failure —
// but it is also never auto-approved, even when tacked onto an otherwise recognized
// command (e.g. "npm test > out.txt"): it falls through to the ASK fallback instead.
function hasFileRedirection(strippedCommand) {
  const pattern = /(\d*)(>{1,2})/g;
  let match;
  while ((match = pattern.exec(strippedCommand)) !== null) {
    const before = strippedCommand[match.index - 1];
    const after = strippedCommand[match.index + match[0].length];
    if (after === '=' || after === '&') continue;
    if (before === '-') continue;
    return true;
  }
  return false;
}

// Compositions (&&, ||, ;, |), subshells ($(...)), backtick substitution, and line
// breaks (LF, CR/CRLF — the shell treats a newline as a command separator just like
// ";") make the overall effect of the command harder to classify safely in this first
// version, so they require a human decision (ASK) even when every visible part looks
// safe on its own.
function hasAmbiguousComposition(strippedCommand) {
  return /&&|\|\||;|\||\$\(|`|\r|\n/.test(strippedCommand);
}

function isRecognizedDiagnostic(strippedCommand) {
  if (hasFileRedirection(strippedCommand)) return false;
  const trimmed = strippedCommand.trim();
  return PASS_THROUGH_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function classify(command) {
  const stripped = stripQuoted(command);
  if (isKnownMutation(stripped)) return 'deny';
  if (hasAmbiguousComposition(stripped)) return 'ask';
  if (isRecognizedDiagnostic(stripped)) return 'pass';
  return 'ask';
}

function validate(input) {
  if (typeof input !== 'object' || input === null) {
    throw new Error('input is not a JSON object');
  }
  if (input.hook_event_name !== 'PreToolUse') {
    throw new Error('unexpected hook_event_name');
  }
  if (input.tool_name !== 'Bash') {
    throw new Error('unexpected tool_name');
  }
  const command = input.tool_input && input.tool_input.command;
  if (typeof command !== 'string' || command.trim() === '') {
    throw new Error('missing or empty tool_input.command');
  }
  return command;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function emitDecision(permissionDecision, permissionDecisionReason) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision,
      permissionDecisionReason,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
}

function fail(message) {
  process.stderr.write(`validate-investigator-bash: ${message}\n`);
  process.exit(2);
}

async function main() {
  const raw = await readStdin();

  let input;
  try {
    input = JSON.parse(raw);
  } catch (err) {
    fail(`invalid JSON input: ${err.message}`);
    return;
  }

  let command;
  try {
    command = validate(input);
  } catch (err) {
    fail(err.message);
    return;
  }

  // Not one of the two agents this validator polices (main thread, another agent,
  // built-in or custom) -> not this validator's call to make. Pass through silently.
  if (!MANAGED_AGENT_TYPES.has(input.agent_type)) {
    process.exit(0);
  }

  const decision = classify(command);

  if (decision === 'pass') {
    process.exit(0);
  } else if (decision === 'deny') {
    emitDecision('deny', DENY_REASON);
    process.exit(0);
  } else {
    emitDecision('ask', ASK_REASON);
    process.exit(0);
  }
}

main().catch((err) => {
  fail(`unexpected error: ${err.message}`);
});
