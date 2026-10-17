# BanglaDoc Agent Guidelines & Rules

## Mandatory Test-Sync Rule
Whenever you add, modify, or refactor any source code (including HTML templates, JavaScript utilities in `js/`, or styling in `css/`):
1. **Identify Affected Tests**: Check corresponding unit tests (`tests/unit/`), integration tests (`tests/integration/`), and Playwright E2E tests (`tests/e2e/`).
2. **Add or Update Matching Tests**: If new behavior or fields are introduced, write or update tests to verify them. Never leave new functionality uncovered.
3. **Execute All Tests**: Run `npm test` and `npm run test:integrity`.
4. **Zero-Defect Verification**: Only finish your task once all tests pass with zero errors. Never alter tests to disguise broken application logic without documenting defects.
