import { z } from 'zod';

export const workflowPerformanceAnalyzerInputSchema = z.object({
  projectSlug: z
    .string()
    .optional()
    .describe('The project slug in the format vcs-slug/org-name/repo-name'),
  workflowName: z
    .string()
    .optional()
    .describe('Optional workflow name to analyze specific workflow'),
  branch: z
    .string()
    .optional()
    .describe('Optional branch name to analyze specific branch'),
  timeWindow: z
    .enum(['7d', '30d', '90d'])
    .default('30d')
    .optional()
    .describe('Time window for analysis'),
});
