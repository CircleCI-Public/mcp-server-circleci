import { getBuildFailureOutputInputSchema } from './inputSchema.js';

export const getBuildFailureLogsTool = {
  name: 'get_build_failure_logs' as const,
  description: `
    This tool helps debug CircleCI build failures by retrieving failure logs.

    Input options (EXACTLY ONE of these two options must be used):

    Option 1 - Direct URL (provide ONE of these):
    - failedJobURL: The URL of the failed CircleCI job (must be provided by the user)
    - failedPipelineURL: The URL of the failed CircleCI pipeline (must be provided by the user)

    Option 2 - Project Detection (ALL of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - branch: The name of the current branch

    IMPORTANT:
    - Never call this tool with incomplete parameters
    - If using Option 1, the URLs MUST be provided by the user - do not attempt to construct or guess URLs
    - If using Option 2, ALL THREE parameters (workspaceRoot, gitRemoteURL, branch) must be provided
    - If neither option can be fully satisfied, ask the user for the missing information before making the tool call
    `,
  inputSchema: getBuildFailureOutputInputSchema,
};
