---
name: fix-flaky-tests
description: Identifies and fixes intermittent or flaky tests in a CircleCI project by analyzing test execution history and applying targeted fixes. Use when tests pass sometimes and fail other times, CI is intermittently failing, tests are unreliable, or the user says "flaky tests", "intermittent failures", "tests are non-deterministic", "flakey", or "test passes locally but fails in CI randomly".
---

# Fix Flaky Tests

## Skill Boundaries

- If the test is consistently failing every run (not intermittent), switch to `debug-build-failures`.
- If the failure is a config YAML error, switch to `validate-circleci-config`.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Identify the project

In order of preference:
1. CircleCI URL provided by the user → use it directly
2. No URL → auto-detect: `workspaceRoot` + `gitRemoteURL`
3. Neither → call `list_followed_projects` and ask the user to pick

### Step 2: Retrieve flaky test data

```
find_flaky_tests(projectSlug | projectURL | workspaceRoot + gitRemoteURL)
```

**CRITICAL:** If the response contains `<MCPTruncationWarning>`, acknowledge it before proceeding.

### Step 3: Classify each flaky test by root cause

| Pattern | Likely cause |
|---|---|
| Fails only in CI, always passes locally | Environment differences, missing env vars, or filesystem assumptions |
| Fails on random timing / async timeouts | Inadequate waits, hardcoded `sleep`, race conditions |
| Fails when run alongside other tests | Shared global state, test ordering dependency, missing cleanup |
| Fails on specific days or times | Hardcoded dates, timezone assumptions, time-dependent logic |
| Fails after a recent dependency update | Breaking change in a transitive dep; check changelogs |

### Step 4: Locate and read the test files

Read the relevant test source files to understand the specific assertions and setup/teardown patterns around the failure.

### Step 5: Apply fixes

| Root cause | Fix |
|---|---|
| Async timing | Replace `sleep(n)` with retry logic or proper `waitFor`/`expect.poll` patterns |
| Shared state | Move setup into `beforeEach`/`afterEach`; avoid module-level mutable state |
| Environment | Use mocks or fixtures instead of real external services; check for missing env vars |
| Test ordering | Randomize test execution order; make each test fully self-contained |
| Date/time | Mock `Date.now()` or use a fixed timestamp in tests |

### Step 6: Validate

After the fix is pushed, check test results:
```
get_job_test_results(filterByTestsResult: "failure")
```

If failures persist, repeat from Step 3 with the new failure data.

## Common Issues and Solutions

| Issue | Solution |
|---|---|
| `find_flaky_tests` returns no results | Flaky test detection requires enough historical run data. Ask the user if the project has had at least ~10 recent pipeline runs. |
| Test is flaky only on specific resource classes | The test may be sensitive to CPU speed or parallelism. Try running it on a smaller resource class to reproduce consistently. |
| Flaky test in a third-party library | Pin the dependency to a specific version and open an issue with the upstream maintainer. |
| `<MCPTruncationWarning>` | Acknowledge truncation. Focus on the most frequently failing tests first. |
| Flaky test passes after retry but CI still marks the build as failed | The test runner retry config may not be set. Point the user to [test retries docs](https://circleci.com/docs/rerun-failed-tests/). |
