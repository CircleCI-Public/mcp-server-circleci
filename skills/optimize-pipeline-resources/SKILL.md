---
name: optimize-pipeline-resources
description: Identifies oversized or underused CircleCI resource classes to reduce CI costs and improve pipeline efficiency. Use when the user wants to reduce CI spend, optimize compute costs, right-size resource classes, find wasted resources, or says "CI is expensive", "pipelines are slow", "how can I reduce cost", "optimize my CI", or "we're spending too much on CircleCI".
---

# Optimize Pipeline Resources

## Skill Boundaries

- If the pipeline is failing (not a cost concern), switch to `debug-build-failures`.
- If the user wants to fix their config syntax or structure, switch to `validate-circleci-config`.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Download usage data

```
download_usage_api_data(orgId, startDate, endDate, outputDir)
```

- Use a **30-day window** for representative data. Shorter windows may miss periodic jobs.
- `outputDir`: use the workspace root, or `~/Downloads` if workspace root is unavailable.
- If the user doesn't know their `orgId`, ask them to find it in CircleCI → Organization Settings → Overview.

### Step 2: Analyze for underused resource classes

```
find_underused_resource_classes(csvFilePath, threshold: 40)
```

- `csvFilePath` must be an absolute path.
- Start with the default threshold of 40. Lower it (e.g. 20) for a conservative report; raise it (e.g. 60) for aggressive right-sizing.

### Step 3: Prioritize findings

Focus on high-impact targets first:

1. **High-frequency jobs** — the most-run jobs yield the biggest savings per improvement
2. **Consistently under 20% CPU and RAM** — strong candidates to downsize 2 steps
3. **20–40% CPU or RAM** — candidates to downsize 1 step

### Step 4: Propose right-sizing changes

For each under-used job, propose the specific resource class change in `.circleci/config.yml`:

**Resource class ladder:**
```
small (1 vCPU / 2GB) → medium (2 vCPU / 4GB) → medium+ (3 vCPU / 6GB)
→ large (4 vCPU / 8GB) → xlarge (8 vCPU / 16GB) → 2xlarge (16 vCPU / 32GB)
```

### Step 5: Validate the config after changes

```
config_helper(configFile: <updated config contents>)
```

Always validate after editing `.circleci/config.yml`.

## Additional optimization strategies

Beyond resource classes, suggest these if they apply:

- **Docker layer caching** — add `docker_layer_caching: true` to executor config; often bigger impact than resource class changes
- **Dependency caching** — `restore_cache`/`save_cache` to avoid re-downloading packages every run
- **Parallelism reduction** — for test suites, fewer parallel containers at the right size often beats many small ones
- **Workflow filtering** — use `filters` to skip expensive jobs on non-default branches
- **Test splitting** — use `circleci tests split` to distribute tests evenly across parallel containers

## Common Issues and Solutions

| Issue | Solution |
|---|---|
| `download_usage_api_data` returns empty | This is a cloud-only feature. Self-hosted CircleCI Server customers cannot use the Usage API. |
| `orgId` not known | Find it at CircleCI → Organization Settings → Overview, or from the URL: `app.circleci.com/organizations/gh/<org>` |
| `find_underused_resource_classes` errors on CSV path | The path must be absolute. Resolve a relative path before calling the tool. |
| All jobs show 100% utilization | The jobs may actually be memory- or CPU-bound. Consider profiling build steps before upsizing. |
| Usage data is older than 32 days | The Usage API has a 32-day max per request. Split into multiple requests if needed. |
