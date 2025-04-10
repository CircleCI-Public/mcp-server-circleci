import { WorkflowPerformanceAnalyzerInputSchema } from './inputSchema.js';
import { CircleCIClients } from '../../clients/circleci/index.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

type WorkflowMetrics = {
  name: string;
  successRate: number;
  averageDuration: number;
  totalRuns: number;
  failedRuns: number;
  slowestJobs: {
    name: string;
    averageDuration: number;
  }[];
};

export const workflowPerformanceAnalyzer: ToolCallback<{
  params: typeof WorkflowPerformanceAnalyzerInputSchema;
}> = async (args) => {
  const circleci = new CircleCIClients({
    token: process.env.CIRCLECI_TOKEN || '',
  });

  if (!args.params.projectSlug) {
    return {
      content: [{ type: 'text', text: 'Project slug is required' }],
    };
  }

  try {
    // Get workflow metrics
    const workflowMetrics = await circleci.insights.getWorkflowMetrics({
      projectSlug: args.params.projectSlug,
      workflowName: args.params.workflowName,
      branch: args.params.branch,
      timeWindow: args.params.timeWindow,
    });

    // Get job metrics for the workflow
    const jobMetrics = await circleci.insights.getJobMetrics({
      projectSlug: args.params.projectSlug || '',
      workflowName: args.params.workflowName,
      branch: args.params.branch,
      timeWindow: args.params.timeWindow,
    });

    // Analyze the data
    const analysis: WorkflowMetrics = {
      name: args.params.workflowName || 'All Workflows',
      successRate:
        (workflowMetrics.metrics.successful_runs /
          workflowMetrics.metrics.total_runs) *
        100,
      averageDuration: workflowMetrics.metrics.duration_metrics.mean,
      totalRuns: workflowMetrics.metrics.total_runs,
      failedRuns: workflowMetrics.metrics.failed_runs,
      slowestJobs: jobMetrics
        .sort(
          (a, b) =>
            b.metrics.duration_metrics.mean - a.metrics.duration_metrics.mean,
        )
        .slice(0, 5)
        .map((job) => ({
          name: job.name,
          averageDuration: job.metrics.duration_metrics.mean,
        })),
    };

    // Generate recommendations
    const recommendations = generateRecommendations(analysis);

    // Format the response
    const response = {
      summary: {
        workflowName: analysis.name,
        successRate: `${analysis.successRate.toFixed(2)}%`,
        averageDuration: `${(analysis.averageDuration / 60).toFixed(2)} minutes`,
        totalRuns: analysis.totalRuns,
        failedRuns: analysis.failedRuns,
      },
      bottlenecks: analysis.slowestJobs.map((job) => ({
        jobName: job.name,
        averageDuration: `${(job.averageDuration / 60).toFixed(2)} minutes`,
      })),
      recommendations,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Failed to analyze workflow performance'}`,
        },
      ],
    };
  }
};

function generateRecommendations(metrics: WorkflowMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.successRate < 90) {
    recommendations.push(
      `⚠️ Low success rate (${metrics.successRate.toFixed(2)}%). Consider investigating the most common failure points.`,
    );
  }

  if (metrics.averageDuration > 30 * 60) {
    // More than 30 minutes
    recommendations.push(
      `⏱️ Long average duration (${(metrics.averageDuration / 60).toFixed(2)} minutes). Consider parallelizing jobs or optimizing slow steps.`,
    );
  }

  if (metrics.slowestJobs.length > 0) {
    const slowestJob = metrics.slowestJobs[0];
    recommendations.push(
      `🐌 Slowest job: ${slowestJob.name} (${(slowestJob.averageDuration / 60).toFixed(2)} minutes). Consider optimizing this job first.`,
    );
  }

  if (metrics.failedRuns > 0) {
    recommendations.push(
      `🔍 ${metrics.failedRuns} failed runs detected. Review the failure patterns to identify common issues.`,
    );
  }

  return recommendations;
}
