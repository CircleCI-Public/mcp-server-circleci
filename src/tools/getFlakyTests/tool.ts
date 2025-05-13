import { getFlakyTestLogsInputSchema } from './inputSchema.js';

export const getFlakyTestLogsTool = {
  name: 'find_flaky_tests' as const,
  description: `
    This tool retrieves information about flaky tests in a CircleCI project. 
    
    The agent receiving this output MUST analyze the flaky test data and implement appropriate fixes based on the specific issues identified.

    CRITICAL REQUIREMENTS:
    1. Truncation Handling (HIGHEST PRIORITY):
       - ALWAYS check for <MCPTruncationWarning> in the output
       - When present, you MUST start your response with:
         "WARNING: The logs have been truncated. Only showing the most recent entries. Earlier build failures may not be visible."
       - Only proceed with log analysis after acknowledging the truncation

    Input options (EXACTLY ONE of these THREE options must be used):

    Option 1 - Project Slug:
    - projectSlug: The project slug obtained from listFollowedProjects tool (e.g., "gh/organization/project")

    Option 2 - Direct URL (provide ONE of these):
    - projectURL: The URL of the CircleCI project in any of these formats:
      * Project URL: https://app.circleci.com/pipelines/gh/organization/project
      * Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123
      * Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def
      * Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/xyz

    Option 3 - Project Detection (ALL of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository

    Additional Requirements:
    - Never call this tool with incomplete parameters
    - If using Option 1, make sure to extract the projectSlug exactly as provided by listFollowedProjects
    - If using Option 2, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 3, BOTH parameters (workspaceRoot, gitRemoteURL) must be provided
    - If none of the options can be fully satisfied, ask the user for the missing information before making the tool call
    `,
  inputSchema: getFlakyTestLogsInputSchema,
};
