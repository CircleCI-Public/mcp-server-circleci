import { getBuildFailureOutputInputSchema } from './inputSchema.js';

export const getBuildFailureLogsTool = {
  name: 'get_build_failure_logs' as const,
  description: `
    This tool helps debug CircleCI build failures by retrieving failure logs.

    Input options (EXACTLY ONE of these two options must be used):

    Option 1 - Direct URL (provide ONE of these):
    - projectURL: The URL of the CircleCI project in any of these formats:
      * Project URL: https://app.circleci.com/pipelines/gh/organization/project
      * Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123
      * Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def
      * Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/xyz

    Option 2 - Project Detection (ALL of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - branch: The name of the current branch

    IMPORTANT:
    - Never call this tool with incomplete parameters
    - If using Option 1, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 2, ALL THREE parameters (workspaceRoot, gitRemoteURL, branch) must be provided
    - If neither option can be fully satisfied, ask the user for the missing information before making the tool call
    - When the output is truncated due to length, inform the user that they are seeing the most recent entries up to the size limit and that earlier logs have been omitted
    `,
  inputSchema: getBuildFailureOutputInputSchema,
};
