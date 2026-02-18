---
name: b4push
description: >-
  Run comprehensive pre-push validation covering builds, tests, and doc site.
  Use when: (1) Completing a PR or feature implementation, (2) Before pushing significant changes,
  (3) After large refactors or multi-file edits, (4) User says 'b4push', 'before push', 'check
  everything', 'run all checks', or 'ready to push'.
user-invocable: true
allowed-tools:
  - Bash
---

# Before Push Check

Run `pnpm b4push` from the project root. This executes `scripts/run-b4push.sh` which runs all checks in order:

1. Build kumiko-gen package
2. Test kumiko-gen package
3. Build svg-to-png package
4. Test svg-to-png package
5. Build kumiko-gen-viewer
6. Doc data generation - doc-titles.json + category-nav.json
7. Doc site build - Full Docusaurus production build

All steps must pass.

## On failure

1. Read the failure output to identify which step failed
2. Fix the issue
3. Re-run `pnpm b4push` to confirm all checks pass
4. Report the final status
