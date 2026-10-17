# BanglaDoc Testing & Test-Sync Guide

This document describes the testing architecture for **BanglaDoc**, how to run tests locally, and the permanent workflows that keep tests synchronized with code changes.

---

## 1. Quick Test Commands

| Command | Description | Tool |
| :--- | :--- | :--- |
| `npm test` | Runs all unit and integration tests | Node.js 22 `node:test` |
| `npm run test:unit` | Runs isolated unit tests (`tests/unit/`) | `node:test` |
| `npm run test:integration` | Runs document preview binding tests | `node:test` + JSDOM |
| `npm run test:coverage` | Runs unit & integration tests with coverage report | `node:test --experimental-test-coverage` |
| `npm run test:integrity` | Verifies 100% of links, assets, and Schema.org | `scripts/test-e2e.js` |
| `npm run test:e2e` | Runs cross-browser end-to-end tests (Desktop & Mobile 360px) | Playwright |
| `npm run test:all` | Runs integrity checks followed by unit and integration tests | All native runners |

---

## 2. The Test-Sync Rule

Whenever you add or modify application source code (`js/`, `*.html`, `css/`):
1. **Identify the affected test suite** (see mapping below).
2. **Add or update the matching tests** to cover the new or changed behavior.
3. **Run the test suite** (`npm test` and `npm run test:integrity`).
4. **Complete the task only when 100% of tests pass** with zero regressions.

### Source-to-Test Mapping

| Source File | Primary Test File(s) |
| :--- | :--- |
| `js/converter.js` | `tests/unit/converter.test.js` |
| `js/theme.js` | `tests/unit/theme.test.js`, `tests/e2e/theme-and-dock.spec.js` |
| `js/autodraft.js` | `tests/unit/autodraft.test.js`, `tests/e2e/rent-flow.spec.js` |
| `rent-agreement.html` | `tests/integration/document-bindings.test.js`, `tests/e2e/rent-flow.spec.js` |
| Other 6 Document HTMLs | `tests/integration/document-bindings.test.js` |
| `index.html` | `tests/e2e/home-navigation.spec.js`, `scripts/test-e2e.js` |

---

## 3. The `/update-tests` Workflow

When working with Antigravity, you can invoke the test synchronization workflow at any time:
- Type `/update-tests` in the chat, or run:
  ```bash
  node scripts/update-tests.js --run
  ```

This workflow:
1. Examines `git diff` against `main` to detect modified source files.
2. Identifies which test files cover them.
3. Verifies that test files were updated alongside source files.
4. Executes the test suite and verifies assertions.

---

## 4. Pre-Commit Hook (Husky + lint-staged)

Git commits are automatically guarded by **Husky** and **lint-staged**:
- When you stage `.js` files, lint-staged runs `node scripts/update-tests.js --run`.
- When you stage `.html` files, lint-staged runs `scripts/test-e2e.js` and `npm test`.
- If tests fail, the commit is blocked before any broken code reaches git history.

---

## 5. Pull Request Template & CI Policy

### Pull Request Checklist
Every pull request uses `.github/pull_request_template.md`, requiring authors to check off:
- `[ ] Tests added/updated for this change`
- `[ ] Unit & Integration tests passing (npm test)`

### CI Enforcement Job
In `.github/workflows/ci.yml`, the **`enforce-tests-in-pr`** job runs on every PR:
- If source files (`js/`, `*.html`, `css/`) are modified, but zero files under `tests/` were changed, **the CI build will fail automatically**.
- This guarantees tests can never fall out of sync with production code.
