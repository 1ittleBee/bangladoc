---
name: update-tests
description: >-
  Use this skill whenever the user asks to update tests, sync tests with code changes,
  invokes /update-tests, or before completing a task where source files were modified.
---

# Workflow: Update & Synchronize Tests

Follow this exact step-by-step procedure to keep tests in sync with codebase changes:

## Step 1: Detect Changed Files
Run the test sync analyzer:
```bash
node scripts/update-tests.js
```
Or check git diff directly:
```bash
git diff --name-only main...HEAD
```

## Step 2: Identify and Update Matching Tests
Based on the changed files:
- **`js/converter.js`**: Update [converter.test.js](file:///f:/App%20Projects%20Ideas/bangladoc/tests/unit/converter.test.js).
- **`js/theme.js`**: Update [theme.test.js](file:///f:/App%20Projects%20Ideas/bangladoc/tests/unit/theme.test.js) & [theme-and-dock.spec.js](file:///f:/App%20Projects%20Ideas/bangladoc/tests/e2e/theme-and-dock.spec.js).
- **`js/autodraft.js`**: Update [autodraft.test.js](file:///f:/App%20Projects%20Ideas/bangladoc/tests/unit/autodraft.test.js).
- **Any Document HTML page** (e.g., `rent-agreement.html`, `bayna-agreement.html`): Update [document-bindings.test.js](file:///f:/App%20Projects%20Ideas/bangladoc/tests/integration/document-bindings.test.js) and Playwright specs if workflows changed.

## Step 3: Run the Test Suites
Execute the full automated test suite:
```bash
npm run test:all
```
Ensure 100% of assertions pass. If any test fails, determine whether the failure is an intentional spec change or a newly introduced bug.

## Step 4: Commit with Conventional Message
Stage the test files and commit:
```bash
git add tests/
git commit -m "test: update tests for <feature-or-fix>"
```

## Step 5: Ask User Before Pushing
Show the git diff and ask for the user's explicit confirmation before running `git push`. Never push automatically.
