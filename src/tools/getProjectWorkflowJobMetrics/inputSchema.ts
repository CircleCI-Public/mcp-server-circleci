import { z } from 'zod';

export const projectWorkflowJobMetricsInputSchema = z.object({
  workspaceRoot: z
    .string()
    .describe(
      'The absolute path to the root directory of your project workspace. ' +
        'This should be the top-level folder containing your source code, configuration files, and dependencies. ' +
        'For example: "/home/user/my-project" or "C:\\Users\\user\\my-project"',
    )
    .optional(),
  gitRemoteURL: z
    .string()
    .describe(
      'The URL of the remote git repository. This should be the URL of the repository that you cloned to your local workspace. ' +
        'For example: "https://github.com/user/my-project.git"',
    )
    .optional(),
  projectURL: z
    .string()
    .describe(
      'The URL of the CircleCI project. This should be a link to the project in the CircleCI web app.',
    )
    .optional(),
  workflowName: z
    .string()
    .describe('The name of the workflow for which to retrieve job metrics'),
  jobName: z
    .string()
    .optional()
    .describe('The name of a specific job to filter results for'),
  reportingWindow: z
    .enum([
      'last-24-hours',
      'last-7-days',
      'last-30-days',
      'last-60-days',
      'last-90-days',
    ])
    .default('last-90-days')
    .optional()
    .describe('Time window for analysis'),
  branch: z
    .string()
    .optional()
    .describe('The name of a specific branch to analyze'),
  allBranches: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to retrieve data for all branches combined'),
});
