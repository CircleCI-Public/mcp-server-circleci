---
name: review-code-changes
description: Reviews staged or unstaged git changes against the project's Cursor rules to catch violations before committing or opening a PR. Use when the user wants to check their code before committing, run a pre-commit review, validate changes against team standards, or says "review my changes", "check my diff", "pre-commit check", "does this violate any rules", or "analyze my staged changes".
---

# Review Code Changes

## Skill Boundaries

- If the user wants to debug a failing CircleCI build, switch to `debug-build-failures`.
- If the user wants to validate `.circleci/config.yml` syntax, switch to `validate-circleci-config`.

## Required Workflow

**Follow these steps in order. Do not skip steps.**

### Step 1: Get the git diff

By default, use staged changes. Use unstaged or all changes only if the user explicitly requests it:

```bash
git diff --cached          # staged (default)
git diff                   # unstaged
git diff HEAD              # all changes (staged + unstaged)
```

### Step 2: Load the project rules

Read the rules from the workspace's `.cursor/rules/` directory. Combine multiple rule files into a single string separated by `---`.

### Step 3: Analyze the diff against the rules

```
analyze_diff(diff: <git diff string>, rules: <combined rules string>)
```

Optional parameters:
- `filterBy: "Violations"` — show only violations (useful when there are many results)
- `speedMode: true` — faster analysis for large diffs; may miss subtle issues

### Step 4: Present results

Group findings by file. For each violation:
- State the rule that was violated
- Quote the specific line(s) from the diff
- Propose a concrete fix

If no violations are found, confirm the diff is clean against the loaded rules.

### Step 5: Offer to fix

If violations are found, offer to apply the fixes directly. After fixes are applied, re-run the analysis to confirm the diff is clean.

## Common Issues and Solutions

| Issue | Solution |
|---|---|
| No `.cursor/rules/` directory found | Ask the user if rules are stored elsewhere (e.g. `.cursorrules`, `AGENTS.md`). Pass those contents as the `rules` parameter. |
| Diff is very large | Use `filterBy: "Violations"` and `speedMode: true` to reduce output. For very large diffs, analyze one file at a time. |
| `analyze_diff` returns no violations on a clearly bad diff | The rules may not cover the specific pattern. Suggest adding a rule for the pattern. |
| User wants to check unstaged changes | Pass `git diff` output instead of `git diff --cached`. Confirm with the user before doing so. |
