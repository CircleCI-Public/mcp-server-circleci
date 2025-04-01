import { getBuildFailureOutputInputSchema } from './inputSchema.js';

export const getBuildFailureLogsTool = {
  name: 'get_build_failure_logs' as const,
  description: `
    This tool helps debug CircleCI build failures by retrieving failure logs.

    Input options:
    1. Direct URLs: User can provide the following URLs
       - CircleCI failed job URL
       - CircleCI failed pipeline URL
    
    2. Project detection: If the user did not provide the URLs, the tool will try to detect the project by providing the following inputs
       - Workspace root path
       - Git remote URL.
       - Branch name
       - GitHub organization name
       - GitHub project name

    The tool will:
    1. Find the relevant build failure
    2. Extract failure logs and context
    3. Return formatted debugging output

    Example:
    Input: failedJobURL = "https://app.circleci.com/pipelines/github/org/repo/123/jobs/456"
    Output: Detailed failure logs with context

    Note: Requires either:
    - A CircleCI job/pipeline URL
    - OR workspace path + git remote URL + branch name + GitHub organization name + GitHub project name
    
    Very Important:
    - Do not hallucinate. Stick the input schema for the tool call.
    `,
  inputSchema: getBuildFailureOutputInputSchema,
};
