# Testing and quality

## Test suites

| Area | What it protects |
| --- | --- |
| `tests/unit/learningSafety.test.js` | Safety detection, scaffold/review/assessment/reward learning logic. |
| `tests/unit/sessionsModule.test.js` | Session authorization, idempotency, safety-first turn behavior, and unavailable AI handling. |
| `tests/unit/studentsModule.test.js` | Student creation, consent, and household scoping. |
| `tests/unit/httpMiddleware.test.js` | HTTP middleware configuration and errors. |
| `tests/unit/httpClient.test.js` | Browser HTTP client behavior. |
| `tests/unit/drizzleSchema.test.js` | Drizzle schema constraints and table shape. |
| `tests/architecture/*` | Module import boundaries, frontend boundaries, and removal of legacy code. |

Run all tests with `npm test`. `npm run qa:smoke` scopes Vitest to unit, component, integration, and architecture directories; directories that do not exist simply contribute no tests at present. `npm run coverage` runs Vitest with V8 coverage and writes the local `coverage/` report.

## Quality commands

| Command | Check |
| --- | --- |
| `npm run lint` | Custom static scan for debugger statements, focused tests, unapproved console logging, and TODO/FIXME markers. |
| `npm run format:check` | Final newline and trailing whitespace across source/documentation/config files. |
| `npm run typecheck` | JavaScript syntax gate for API, scripts, and tests; this repository has no TypeScript compiler type check. |
| `npm run coverage` | Test run with V8 coverage reporting; enforces at least 75% statements, branches, functions, and lines globally. |
| `npm run build` | Production Vite build. |
| `npm run audit:prod` | NPM production-dependency vulnerability audit. |
| `npm run secret:scan` | Pattern scan of source, docs, and GitHub config for common credential material. |
| `npm run sbom` | Writes a CycloneDX JSON software bill of materials to stdout. |
| `npm run check` | Lint, format, syntax, coverage, and web build. |
| `npm run ci` | Reinstalls dependencies then runs the full release-quality sequence. |

The GitHub Actions workflow runs `npm ci`, lint, formatting, syntax, coverage, build, production audit, secret scan, and SBOM generation on pushes to `main` and pull requests.

## Documentation verification

When changing this `docs/` directory:

1. Check every relative Markdown link resolves to an existing file and every command/path matches the current repository.
2. Keep Mermaid fences valid (`mermaid` immediately after the opening fence) and use simple node labels so standard Markdown renderers can parse them.
3. Run `npm run format:check` and `npm run secret:scan`; both include Markdown under `docs`.
4. Run at least `npm run check` when application-adjacent documentation changes occur, and inspect docs changes for statements that are aspirational versus implemented.

Documentation should never include real API keys, SMTP URLs with credentials, encryption keys, parent tokens, or child data.
