import { FilterBy } from '../shared/constants.js';
import { analyzeDiffInputSchema } from './inputSchema.js';

export const analyzeDiffTool = {
  name: 'analyze_diff' as const,
  description: `
  This tool is used to analyze a git diff (unstaged, staged, or all changes) against cursor rules to identify rule violations.
  By default, the tool will use the staged changes, unless the user explicitly asks for unstaged or all changes.

  Parameters:
  - params: An object containing:
    - speedMode: boolean - A mode that can be enabled to speed up the analysis. Default value is false.
    - filterBy: enum - "${FilterBy.violations}" | "${FilterBy.compliants}" | "${FilterBy.humanReviewRequired}" | "${FilterBy.none}" - A filter that can be applied to set the focus of the analysis. Default is ${FilterBy.none}.
    - diff: string - A git diff string.
    - rules: string - The rules to use for the analysis, found in .cursorrules or the .cursor/rules directory. Combine all rules from multiple files by separating them with ---

  Returns:
  - A list of rule violations found in the git diff.
  `,
  inputSchema: analyzeDiffInputSchema,
};
