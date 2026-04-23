---
name: rollback-deployment
description: Guides a user through rolling back a CircleCI deployment to a previous version, either via a rollback pipeline or workflow rerun. Use when a bad deployment needs to be reverted, a release caused an incident, the user wants to go back to a previous version, or says "rollback", "revert deployment", "undo release", "go back to previous version", "production is broken after deploy", or "we need to roll back".
---

# Rollback Deployment

## Skill Boundaries

- If the pipeline is failing but not deployed yet, switch to `debug-build-failures` to fix it first.
- If the user wants to rerun a failed pipeline (not a deployment rollback), use `rerun_workflow` directly.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Identify the project

Call `list_followed_projects` if a project slug or ID is not already provided. Present the full list and ask the user to pick.

### Step 2: List available versions

```
list_component_versions(projectSlug | projectID)
```

This is a multi-step guided call:
1. First call returns available **environments** → ask the user to select one
2. Second call (with `environmentID`) returns available **components** → ask the user to select one
3. Third call (with `environmentID` + `componentID`) returns the **version list**

Present the full version list. Identify which version is currently live (`is_live: true`) and which version to roll back to.

### Step 3: Ask for rollback reason (optional)

Ask: "Do you have a reason for this rollback? (optional — used for audit logs)"

Skip this step only if the user has explicitly requested a workflow rerun instead of a pipeline rollback.

### Step 4: Check for rollback pipeline

The tool will report whether a rollback pipeline is configured for the project.

- **Rollback pipeline configured** → proceed to Step 5a
- **No rollback pipeline** → inform the user. Offer two options:
  1. Trigger a rollback by workflow rerun (Step 5b)
  2. Set up a rollback pipeline ([CircleCI rollback pipeline docs](https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/))

### Step 5a: Confirm and execute pipeline rollback

Summarize before executing:
```
Rolling back: <project>
Environment:  <environment>
Component:    <component>
From version: <currentVersion>
To version:   <targetVersion>
Reason:       <reason or "not provided">
```

Ask the user to confirm. Then:

```
run_rollback_pipeline(projectSlug, environmentName, componentName, currentVersion, targetVersion, namespace, reason)
```

### Step 5b: Rollback by workflow rerun

Get the workflow ID from the target version's deployment data, then:

```
rerun_workflow(workflowId, fromFailed: false)
```

This reruns the entire workflow from the start, effectively re-deploying the older version.

### Step 6: Report outcome

On success: provide the rollback ID or new workflow URL for the user to monitor.
On error: explain what went wrong and what the user needs to do to resolve it.

## Important constraints

- Never guess or construct project slugs. Only use values from `list_followed_projects` or provided by the user.
- Never suggest trying a different project if the selected project lacks rollback configuration — the user must configure it for that specific project.
- If no versions are found, direct the user to [deploy markers docs](https://circleci.com/docs/deploy/configure-deploy-markers/).

## Common Issues and Solutions

| Issue | Solution |
|---|---|
| "No rollback pipeline defined" | The project needs a rollback pipeline configured. Share the [setup docs](https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/). Offer workflow rerun as an interim option. |
| No versions listed | Deploy markers are not configured. Share the [deploy markers docs](https://circleci.com/docs/deploy/configure-deploy-markers/). |
| "Insufficient permissions" | The user's CircleCI token needs write access. Ask them to check their API token permissions. |
| More than 20 environments or components listed | Too many options to display clearly. Ask the user to type the environment or component name to narrow it down. |
| User wants to roll back to a version not in the list | Only versions tracked via deploy markers are available. If the target version predates marker setup, a workflow rerun is the only option. |
