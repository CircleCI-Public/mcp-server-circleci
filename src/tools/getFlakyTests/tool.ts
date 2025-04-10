import { getFlakyTestLogsInputSchema } from './inputSchema.js';

export const getFlakyTestLogsTool = {
  name: 'find_flaky_tests' as const,
  description: `
    This tool retrieves information about flaky tests in a CircleCI project. 
    
    The agent receiving this output MUST analyze the flaky test data and implement appropriate fixes based on the specific issues identified.

    Input options (EXACTLY ONE of these two options must be used):

    Option 1 - Direct URL:
    - projectURL: The URL of the CircleCI project (must be provided by the user)

    Option 2 - Project Detection (ALL of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository

    IMPORTANT:
    - Never call this tool with incomplete parameters
    - If using Option 1, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 2, BOTH parameters (workspaceRoot, gitRemoteURL) must be provided
    - If neither option can be fully satisfied, ask the user for the missing information before making the tool call
    `,
  inputSchema: getFlakyTestLogsInputSchema,
};
