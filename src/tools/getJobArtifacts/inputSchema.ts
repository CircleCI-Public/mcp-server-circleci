import { z } from 'zod';
import {
  branchDescription,
  projectSlugDescription,
} from '../shared/constants.js';

export const getJobArtifactsInputSchema = z.object({
  // Option 1: Direct parameters
  projectSlug: z.string().describe(projectSlugDescription).optional(),
  branch: z.string().describe(branchDescription).optional(),
  jobNumber: z
    .number()
    .describe(
      'The job number to fetch artifacts from. Required when using projectSlug.',
    )
    .optional(),

  // Option 2: Job URL
  jobURL: z
    .string()
    .describe(
      'The URL of the CircleCI job. Can be in these formats:\n' +
        '- Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/456\n' +
        '- Legacy job URL: https://circleci.com/gh/organization/project/456',
    )
    .optional(),

  // Option 3: Workspace detection
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

  // Optional filters
  artifactPath: z
    .string()
    .describe(
      'Filter artifacts by path prefix (e.g., "coverage/", "test-results/")',
    )
    .optional(),
});
