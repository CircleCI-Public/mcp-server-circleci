import { projectWorkflowJobMetricsInputSchema } from './inputSchema.js';

export const projectWorkflowJobMetricsTool = {
  name: 'get_project_workflow_job_metrics' as const,
  description: `
    This tool retrieves summary metrics for a project workflow's jobs from CircleCI.
    
    Input options (EXACTLY ONE of these options must be used):
    
    Option 1 - Direct URL:
    - projectURL: The URL of the CircleCI project (must be provided by the user)
    - workflowName: The name of the workflow for which to retrieve job metrics (required)
    
    Option 2 - Project Detection (BOTH of these must be provided together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - workflowName: The name of the workflow for which to retrieve job metrics (required)
    
    Additional optional parameters:
    - jobName: The name of a specific job to filter results for
    - reportingWindow: Time window for metrics (last-24-hours, last-7-days, last-30-days, last-60-days, last-90-days)
    - branch: The name of a specific branch to analyze
    - allBranches: Whether to retrieve data for all branches combined
    
    The tool provides job-level metrics within a workflow including:
    - Total runs, successful runs, and failed runs
    - Success rate and credit usage
    - Duration metrics (min, mean, median, p95, max, standard deviation)
    - Throughput statistics
    
    Note: Metrics are refreshed daily and may not include executions from the last 24 hours.
    This is not a financial reporting tool and should not be used for precise credit reporting.
  `,
  inputSchema: projectWorkflowJobMetricsInputSchema,
};
