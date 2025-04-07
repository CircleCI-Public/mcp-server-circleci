import { z } from 'zod';

export const getFlakyTestLogsInputSchema = z.object({
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
});
