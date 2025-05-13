import { listFollowedProjectsInputSchema } from './inputSchema.js';

export const listFollowedProjectsTool = {
  name: 'list_followed_projects' as const,
  description: `
    This tool lists all projects that the user is following on CircleCI.
    
    Common use cases:
    - Identify which CircleCI projects are available to the user
    - Select a project for subsequent operations
    - Obtain the projectSlug needed for other CircleCI tools
    
    Returns:
    - A list of projects that the user is following on CircleCI
    - Each entry includes the project name and its projectSlug
    
    Workflow:
    1. Run this tool to see available projects
    2. User selects a project from the list
    3. The LLM should extract and use the projectSlug (not the project name) from the selected project for subsequent tool calls
    4. The projectSlug is required for many other CircleCI tools, including get_build_failure_logs, getFlakyTests, and get_job_test_results
    
    Note: If pagination limits are reached, the tool will indicate that not all projects could be displayed.
    
    IMPORTANT: Do not automatically run any additional tools after this tool is called. Wait for explicit user instruction before executing further tool calls. It is acceptable to list out tool call options for the user to choose from.
    `,
  inputSchema: listFollowedProjectsInputSchema,
};
