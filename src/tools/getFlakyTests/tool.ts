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

    Input options (in order of preference):

    Preferred Option - MCP Config:
    If .circleci/mcp_config.json exists (containing projectSlug), no additional parameters needed

    Fallback Option 1 - Direct URL:
    If mcp_config.json is not available, provide ONE of these URLs:
    - Project URL: https://app.circleci.com/pipelines/gh/organization/project
    - Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123
    - Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def
    - Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/xyz

    Fallback Option 2 - Project Detection:
    If neither mcp_config.json nor URLs are available, provide ALL of these:
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository

    Additional Requirements:
    - Never call this tool with incomplete parameters
    - First check for mcp_config.json and use it if available
    - If mcp_config.json is not available, prefer direct URLs over project detection
    - URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - For project detection, BOTH parameters must be provided
    - If no option can be fully satisfied, ask the user for the missing information before making the tool call
    `,
  inputSchema: getFlakyTestLogsInputSchema,
};
