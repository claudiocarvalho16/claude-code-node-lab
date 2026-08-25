# CLAUDE.md

## Project overview

This repository is a small NestJS/TypeScript REST API used as a reference project for learning and validating Claude Code workflows.

The application domain is a CRUD of Tasks. Keep the implementation small, professional, and easy to understand. Introduce additional infrastructure or abstractions only when they provide clear value.

## Architecture

Follow standard NestJS feature organization using modules, controllers, services, and colocated unit tests.

Prefer extending existing patterns over introducing new architectural layers prematurely.

Do not introduce authentication, messaging, caching, Docker, or similar infrastructure unless explicitly requested.

## Commands

```bash
npm run start:dev
npm run build
npm run lint
npm run format
npm run test
npm run test:e2e
```

## Tests

Unit tests (*.spec.ts) are colocated with source files under src/.

E2E tests live under test/ and use test/jest-e2e.json.

Run a single unit test with:

```bash
npx jest path/to/file.spec.ts
```

or by test name:
```bash
npx jest -t 'test name'
```
