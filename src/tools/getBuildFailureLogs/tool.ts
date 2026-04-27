import { getBuildFailureOutputInputSchema } from './inputSchema.js';
import { option1DescriptionBranchRequired } from '../shared/constants.js';

export const getBuildFailureLogsTool = {
  name: 'get_build_failure_logs' as const,
  description: `
    This tool helps debug CircleCI build failures by retrieving failure logs.

    CRITICAL REQUIREMENTS:
    1. Large Log Handling:
       - If you expect large logs or want the full output, provide outputDir. The full logs will be written to a file and the path returned.
         * Use the project/workspace root when available, otherwise use the Downloads folder (e.g., "~/Downloads").
       - If outputDir is omitted, logs are returned inline but may be truncated. When truncated, output will contain <MCPTruncationWarning> and you MUST acknowledge: "WARNING: The logs have been truncated. Only showing the most recent entries."

    Input options (EXACTLY ONE of these THREE options must be used):

    ${option1DescriptionBranchRequired}

    Option 2 - Direct URL (provide ONE of these):
    - projectURL: The URL of the CircleCI project in any of these formats:
      * Project URL: https://app.circleci.com/pipelines/gh/organization/project
      * Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123
      * Legacy Job URL: https://circleci.com/pipelines/gh/organization/project/123
      * Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def
      * Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/xyz

    Option 3 - Project Detection (ALL of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - branch: The name of the current branch
    
    Recommended Workflow:
    1. Use listFollowedProjects tool to get a list of projects
    2. Extract the projectSlug from the chosen project (format: "gh/organization/project")
    3. Use that projectSlug with a branch name for this tool

    Additional Requirements:
    - Never call this tool with incomplete parameters
    - If using Option 1, make sure to extract the projectSlug exactly as provided by listFollowedProjects
    - If using Option 2, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 3, ALL THREE parameters (workspaceRoot, gitRemoteURL, branch) must be provided
    - If none of the options can be fully satisfied, ask the user for the missing information before making the tool call
    `,
  inputSchema: getBuildFailureOutputInputSchema,
};
