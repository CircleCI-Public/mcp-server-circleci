import { runPipelineInputSchema } from './inputSchema.js';

export const runPipelineTool = {
  name: 'run_pipeline' as const,
  description: `
    This tool triggers a new CircleCI pipeline and returns the URL to monitor its progress.

    Input options (EXACTLY ONE of these THREE options must be used):

    Option 1 - Project Slug (BOTH of these must be provided together):
    - projectSlug: The project slug obtained from listFollowedProjects tool (e.g., "gh/organization/project")
    - branch: The name of the branch to retrieve logs for

    Option 2 - Direct URL (provide ONE of these):
    - projectURL: The URL of the CircleCI project in any of these formats:
      * Project URL with branch: https://app.circleci.com/pipelines/gh/organization/project?branch=feature-branch
      * Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123
      * Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def
      * Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/xyz

    Option 3 - Project Detection (ALL of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - branch: The name of the current branch

    Pipeline Selection:
    - If the project has multiple pipeline definitions, the tool will return a list of available pipelines
    - You must then make another call with the chosen pipeline name using the pipelineChoiceName parameter
    - The pipelineChoiceName must exactly match one of the pipeline names returned by the tool
    - If the project has only one pipeline definition, pipelineChoiceName is not needed

    Additional Requirements:
    - Never call this tool with incomplete parameters
    - If using Option 1, make sure to extract the projectSlug exactly as provided by listFollowedProjects
    - If using Option 2, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 3, ALL THREE parameters (workspaceRoot, gitRemoteURL, branch) must be provided
    - If none of the options can be fully satisfied, ask the user for the missing information before making the tool call

    Returns:
    - A URL to the newly triggered pipeline that can be used to monitor its progress
    `,
  inputSchema: runPipelineInputSchema,
};
