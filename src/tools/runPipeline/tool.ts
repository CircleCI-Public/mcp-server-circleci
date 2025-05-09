import { runPipelineInputSchema } from './inputSchema.js';

export const runPipelineTool = {
  name: 'run_pipeline' as const,
  description: `
    This tool triggers a new CircleCI pipeline and returns the URL to monitor its progress.

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

    Additional Requirements:
    - Never call this tool with incomplete parameters
    - If using Option 1, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 2, ALL THREE parameters (workspaceRoot, gitRemoteURL, branch) must be provided
    - If neither option can be fully satisfied, ask the user for the missing information before making the tool call

    Returns:
    - A URL to the newly triggered pipeline that can be used to monitor its progress
    `,
  inputSchema: runPipelineInputSchema,
};
