import { z } from 'zod';
import {
  branchDescription,
  projectSlugDescription,
} from '../shared/constants.js';

export const listArtifactsInputSchema = z.object({
  projectSlug: z.string().describe(projectSlugDescription).optional(),
  branch: z.string().describe(branchDescription).optional(),
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
      'The URL of the CircleCI project. Can be any of these formats:\n' +
        '- Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/789\n' +
        '- Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def\n' +
        '- Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123',
    )
    .optional(),
});
