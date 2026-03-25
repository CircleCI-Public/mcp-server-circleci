---
name: validate-circleci-config
description: Validates, fixes, and improves CircleCI configuration files using the CircleCI config API. Use when editing .circleci/config.yml, when a pipeline fails with a config error, when writing a new workflow or job, when migrating from another CI system, or the user says "validate my config", "fix my circleci config", "config is invalid", "YAML error", "unknown key in config", or "write me a CircleCI config".
---

# Validate CircleCI Config

## Skill Boundaries

- If the config is valid but the pipeline is still failing at runtime (job steps, test errors), switch to `debug-build-failures`.
- If the user wants to reduce pipeline cost or speed, switch to `optimize-pipeline-resources`.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Read the config file

```
Read: .circleci/config.yml
```

If the file doesn't exist and the user wants to create one, ask about their stack (language/runtime, test framework, deployment target, any required secrets/contexts) before drafting.

### Step 2: Validate with the CircleCI API

```
config_helper(configFile: <full raw YAML contents>)
```

Pass the full file contents as a string, not a file path.

### Step 3: Interpret results

- **Valid** → confirm and summarize what the config does (workflows, jobs, parallelism, key orbs).
- **Invalid** → the tool returns line-level errors. Fix each error, then re-validate. Repeat until clean.

### Step 4: Apply fixes and re-validate

Fix errors one category at a time. After each fix, re-run `config_helper`. Repeat until validation passes cleanly.

### Step 5: Apply config best practices

After the config is valid, check for and suggest the following improvements:

- **Pin orb versions** — replace `circleci/node@volatile` with `circleci/node@7.1.0`
- **Right-size resource classes** — default to `medium`; only go higher if the job needs it
- **Add caching** — use `restore_cache`/`save_cache` or `node/install-packages` with cache enabled
- **Use contexts for secrets** — never hardcode tokens; reference via `context:` or environment variables
- **Workspace for artifacts** — use `persist_to_workspace` / `attach_workspace` instead of re-running steps
- **Branch/tag filters** — avoid running all jobs on every commit; use `filters` to gate deployments

## Common Errors and Fixes

| Error | Fix |
|---|---|
| `required key not found: steps` | Every job must have a `steps:` key |
| `unknown key` | Check indentation — YAML is indent-sensitive; the key may be nested incorrectly |
| `invalid orb reference` | Format must be `namespace/name@version` (e.g. `circleci/node@7`) |
| `context not found` | The context must exist in your CircleCI org settings and be shared with the project |
| `unknown executor` | Executor must be defined under `executors:` at the top level or declared inline in the job |
| `duplicate key` | Remove the duplicate YAML key; YAML doesn't allow duplicate keys at the same level |
| `could not parse version` | `version:` must be `2.1` (not `2`, not quoted incorrectly) |

## Config skeleton reference

```yaml
version: 2.1

orbs:
  node: circleci/node@7

jobs:
  build-and-test:
    executor: node/default
    resource_class: medium
    steps:
      - checkout
      - node/install-packages:
          cache-path: ~/project/node_modules
          override-ci-command: npm ci
      - run:
          name: Run tests
          command: npm test

workflows:
  ci:
    jobs:
      - build-and-test
```
