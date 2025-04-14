import { projectWorkflowMetricsInputSchema } from './inputSchema.js';

export const projectWorkflowMetricsTool = {
  name: 'get_project_workflow_metrics' as const,
  description: `
    This tool retrieves summary metrics for a project's workflow from CircleCI given a workflow name.
    
    Input options (EXACTLY ONE of these options must be used):
    
    Option 1 - Direct URL:
    - projectURL: The URL of the CircleCI project (must be provided by the user)
    - workflowName: The name of the workflow to retrieve metrics for (required)
    
    Option 2 - Project Detection (these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - workflowName: The name of the workflow to retrieve metrics for (required)
    
    Additional optional parameters:
    - reportingWindow: Time window for metrics (last-24-hours, last-7-days, last-30-days, last-60-days, last-90-days)
    - branch: The name of a specific branch to analyze
    - allBranches: Whether to retrieve data for all branches combined
    - pageToken: A token to retrieve the next page of results
    
    The tool provides workflow-level metrics including:
    - Total runs, successful runs, and failed runs
    - Success rate and mean time to recovery (MTTR)
    - Duration metrics (min, mean, median, p95, max, standard deviation)
    - Credit usage and throughput statistics
    
    Note: Metrics are refreshed daily and may not include executions from the last 24 hours.
    This is not a financial reporting tool and should not be used for precise credit reporting.
  `,
  inputSchema: projectWorkflowMetricsInputSchema,
};
