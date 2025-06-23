import { z } from 'zod';
import { FilterBy } from '../shared/constants.js';

export const analyzeDiffInputSchema = z.object({
  speedMode: z
    .boolean()
    .default(false)
    .describe('The status of speed mode. Defaults to false.'),
  filterBy: z
    .nativeEnum(FilterBy)
    .default(FilterBy.none)
    .describe(`Analysis filter. Defaults to ${FilterBy.none}`),
  diff: z
    .string()
    .describe(
      'Git diff content to analyze. Defaults to staged changes, unless the user explicitly asks for unstaged changes or all changes.',
    ),
  rules: z
    .string()
    .describe(
      'Rules to use for analysis, found in .cursorrules or the .cursor/rules directory. Combine all rules from multiple files by separating them with ---',
    ),
});
