import { analyzeDiffInputSchema } from './inputSchema.js';

export const analyzeDiffTool = {
  name: 'analyze_diff' as const,
  description: `
  This tool is used to analyze a git diff (unstaged, staged, or all changes) against cursor rules to check for rule violations.
  By default, the tool will use the staged changes if the user does not explicitly ask for unstaged changes or all changes.

  Parameters:
  - params: An object containing:
    - diff: string - A git diff string.
    - rules: string - Rules to use for analysis. Rule from .cursorrules or rules in .cursor/rules directory. Combine all rules from multiple files by separating them with ---

  Returns:
  - A list of violations found in the git diff.
  `,
  inputSchema: analyzeDiffInputSchema,
};
