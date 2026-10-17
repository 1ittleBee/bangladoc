# Rule: Tests Must Synchronize with Code Changes

**Scope:** Workspace-wide (`f:/App Projects Ideas/bangladoc`)

Whenever you add or modify source code:
1. You must immediately add or update the matching tests.
2. Run the test suite (`npm test`, `npm run test:integrity`).
3. Ensure 100% of the assertions pass before completing the task.
4. If a bug is discovered in existing code, preserve application behavior and record the bug in the QA defect log unless explicitly instructed to fix it.
