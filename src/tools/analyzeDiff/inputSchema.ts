import { z } from 'zod';

export const analyzeDiffInputSchema = z.object({
  diff: z
    .string()
    .describe(
      'Git diff content to analyze. Default is staged change if user is not explicitly asking for unstaged changes or all changes.',
    ),
  rules: z
    .string()
    .describe(
      'Rules to use for analysis. Rule from .cursorrules or rules in .cursor/rules directory. Combine all rules from multiple files by separating them with ---',
    ),
});
