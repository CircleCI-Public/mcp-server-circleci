---
name: debug-build-failures
description: Diagnoses and fixes CircleCI pipeline failures using build logs, test results, and job output. Use when a build is failing, a pipeline is red, CI is broken, tests are failing in CI, or the user says "my build failed", "why is CI failing", "pipeline is red", "fix my CI", "build is broken", or provides a CircleCI pipeline or job URL.
---

# Debug Build Failures

## Skill Boundaries

- If the failure message mentions a YAML parse error, config error, or invalid key, switch to `validate-circleci-config`.
- If the same test fails sometimes but passes other times (intermittent), switch to `fix-flaky-tests`.
- If the user wants to roll back a deployment after a bad pipeline, switch to `rollback-deployment`.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Identify the project

In order of preference:
1. CircleCI URL provided by the user → use it directly
2. No URL → auto-detect using workspace context: `workspaceRoot` + `gitRemoteURL` + current branch
3. Neither available → call `list_followed_projects` and ask the user to pick

### Step 2: Get pipeline status

```
get_latest_pipeline_status(projectSlug, branch)
```

Identify which workflows and jobs failed. Note the job names — you'll need them in the next step.

### Step 3: Retrieve failure logs

```
get_build_failure_logs(projectSlug, branch)
```

**CRITICAL:** If the response contains `<MCPTruncationWarning>`, start your response with:
> "WARNING: The logs have been truncated. Only showing the most recent entries. Earlier build failures may not be visible."

Only proceed with analysis after acknowledging the truncation.

### Step 4: Classify the failure

| Signal in the logs | Next action |
|---|---|
| Test assertion errors / `FAILED` / `Expected ... but got` | Call `get_job_test_results(filterByTestsResult: "failure")` |
| YAML parse error / `unknown key` / `invalid config` | Switch to `validate-circleci-config` skill |
| Exit code 1 with no test output | Read the specific failing step's shell output from the logs |
| Passes sometimes, fails sometimes | Switch to `fix-flaky-tests` skill |
| Missing env var / secret | Ask the user to verify the CircleCI context or project env var settings |

### Step 5: For test failures — get structured test data

```
get_job_test_results(projectSlug OR projectURL OR workspaceRoot + gitRemoteURL + branch, filterByTestsResult: "failure")
```

This returns structured data (file, test name, error message, duration) — much more reliable than parsing raw log text. Use it instead of scanning logs for test names.

### Step 6: Propose a fix

Be specific. Include:
- The exact file and line number where the fix is needed
- The code change (show a diff or before/after)
- Why this fixes the root cause

### Step 7: Close the loop

After the user applies the fix, offer to re-trigger CI:
```
run_pipeline(workspaceRoot + gitRemoteURL + branch)
```
Or rerun just the failed workflow:
```
rerun_workflow(workflowId, fromFailed: true)
```

## Common Issues and Solutions

| Issue | Solution |
|---|---|
| `<MCPTruncationWarning>` in response | Acknowledge truncation first. Focus on the last visible error. Ask the user if earlier failures are also relevant. |
| Logs show no clear error | Look for the last non-zero exit code. Check `resource_class` limits (OOM kills show as exit 137). |
| `get_job_test_results` returns empty | Test metadata is not configured. Direct the user to [Collect Test Data docs](https://circleci.com/docs/collect-test-data/). |
| Build passes locally, fails in CI | Check for missing env vars, hardcoded paths, OS differences, or race conditions in async code. |
| Step fails with exit 137 | Out-of-memory kill. Suggest upgrading `resource_class` or reducing parallelism. |
| "Context not found" error | The CircleCI context referenced in config doesn't exist or the project doesn't have access. |
