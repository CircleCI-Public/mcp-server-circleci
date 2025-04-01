import { z } from 'zod';

export const getBuildFailureOutputInputSchema = z.object({
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
  branch: z
    .string()
    .describe(
      'The name of the branch currently checked out in local workspace. ' +
        'This should match local git branch. ' +
        'For example: "feature/my-branch", "bugfix/123", "main", "master" etc.',
    )
    .optional(),
  failedPipelineURL: z
    .string()
    .describe(
      'The URL of the failed CircleCI pipeline. This should be a link to the pipeline in the CircleCI web app.',
    )
    .optional(),
  failedJobURL: z
    .string()
    .describe(
      'The URL of the failed CircleCI job. This should be a link to the job in the CircleCI web app.',
    )
    .optional(),
});
