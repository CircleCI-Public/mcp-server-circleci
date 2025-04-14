import { projectWorkflowTestMetricsInputSchema } from './inputSchema.js';

export const projectWorkflowTestMetricsTool = {
  name: 'get_project_workflow_test_metrics' as const,
  description: `
    This tool retrieves test metrics for a project's workflow from CircleCI.
    
    Input options (EXACTLY ONE of these options must be used):
    
    Option 1 - Direct URL:
    - projectURL: The URL of the CircleCI project (must be provided by the user)
    - workflowName: The name of the workflow for which to retrieve test metrics (required)
    
    Option 2 - Project Detection (BOTH of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - workflowName: The name of the workflow for which to retrieve test metrics (required)
    
    Additional optional parameters:
    - branch: The name of a specific branch to analyze
    - allBranches: Whether to retrieve data for all branches combined
    
    The tool provides test metrics within a workflow including:
    - Average test count and total test runs
    - Most frequently failing tests
    - Slowest running tests
    - Test counts grouped by pipeline number and workflow ID
    
    Note: Currently test metrics are calculated based on the 10 most recent workflow runs.
  `,
  inputSchema: projectWorkflowTestMetricsInputSchema,
};
