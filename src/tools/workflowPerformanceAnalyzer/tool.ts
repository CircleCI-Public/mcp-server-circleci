import { WorkflowPerformanceAnalyzerInputSchema } from './inputSchema.js';

export const workflowPerformanceAnalyzerTool = {
  name: 'workflow_performance_analyzer' as const,
  description: `
    This tool analyzes CircleCI workflow performance metrics to identify bottlenecks and optimization opportunities.

    Required inputs:
    - projectSlug: The project slug in the format vcs-slug/org-name/repo-name

    Optional inputs:
    - workflowName: Specific workflow to analyze (if not provided, analyzes all workflows)
    - branch: Specific branch to analyze (if not provided, analyzes all branches)
    - timeWindow: Time period for analysis (7d, 30d, or 90d, defaults to 30d)

    The tool provides:
    - Success rate and average duration metrics
    - Identification of slowest jobs
    - Recommendations for optimization
    `,
  inputSchema: WorkflowPerformanceAnalyzerInputSchema,
};
