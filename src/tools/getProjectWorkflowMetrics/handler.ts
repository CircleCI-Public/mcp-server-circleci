import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CircleCIClients } from '../../clients/circleci/index.js';
import {
  getProjectSlugFromProjectURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { projectWorkflowMetricsInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { WorkflowMetrics } from '../../clients/schemas.js';

export const projectWorkflowMetrics: ToolCallback<{
  params: typeof projectWorkflowMetricsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    projectURL,
    workflowName,
    reportingWindow = 'last-90-days',
    branch,
    allBranches = false,
  } = args.params;

  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set');
  }

  if (!workflowName) {
    return mcpErrorOutput(
      'No workflow name provided. Ask the user to provide the workflow name.',
    );
  }

  const token = process.env.CIRCLECI_TOKEN;
  let projectSlug: string | null | undefined;

  // Determine project slug from inputs
  if (projectURL) {
    projectSlug = getProjectSlugFromProjectURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL) {
    projectSlug = await identifyProjectSlug({
      token,
      gitRemoteURL,
    });
  } else {
    return mcpErrorOutput(
      'No inputs provided. Ask the user to provide either a project URL, or both workspace root and git remote URL.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput(`
      Project not found. Ask the user to provide either a project URL, or both workspace root and git remote URL.

      Project slug: ${projectSlug}
      Git remote URL: ${gitRemoteURL}
    `);
  }

  // Initialize CircleCI client
  const circleci = new CircleCIClients({ token });

  try {
    // Configure options for API call
    const options: {
      reportingWindow?:
        | 'last-24-hours'
        | 'last-7-days'
        | 'last-30-days'
        | 'last-60-days'
        | 'last-90-days';
      allBranches?: boolean;
      branch?: string;
      maxPages?: number;
      timeoutMs?: number;
    } = {
      reportingWindow,
    };

    // Handle branch filtering - either all branches or specific branch
    if (allBranches) {
      options.allBranches = true;
    } else if (branch) {
      options.branch = branch;
    }

    // Get project workflow metrics
    const workflowsMetrics = await circleci.insights.getProjectWorkflowsMetrics(
      {
        projectSlug,
        options,
      },
    );

    const workflowMetrics = workflowsMetrics.find(
      (workflow) => workflow.name === workflowName,
    );

    if (!workflowMetrics) {
      return {
        content: [
          {
            type: 'text',
            text: 'No workflow metrics found for the specified project and filters.',
          },
        ],
      };
    }

    // Format the metrics data for display
    const formattedMetrics = workflowsMetrics.map(formatWorkflowMetrics);

    // Format the response according to MCP format
    return {
      content: [
        {
          type: 'text',
          text: `Successfully retrieved ${formattedMetrics.length} workflow metrics for ${projectSlug}.`,
        },
        {
          type: 'text',
          text: JSON.stringify(formattedMetrics, null, 2),
        },
      ],
    };
  } catch (error) {
    return mcpErrorOutput(
      `Error retrieving project workflow metrics: ${(error as Error).message}`,
    );
  }
};

/**
 * Formats workflow metrics for display
 */
function formatWorkflowMetrics(metric: WorkflowMetrics) {
  const {
    name,
    metrics: {
      total_runs,
      successful_runs,
      failed_runs,
      success_rate,
      mttr,
      total_credits_used,
      throughput,
      duration_metrics,
      total_recoveries,
    },
    window_start,
    window_end,
    project_id,
  } = metric;

  return {
    name,
    metrics: {
      total_runs,
      successful_runs,
      failed_runs,
      success_rate: `${(success_rate * 100).toFixed(2)}%`,
      mttr: mttr ? formatDuration(mttr) : 'N/A',
      total_credits_used,
      throughput: `${throughput.toFixed(2)} runs/day`,
      duration_metrics: {
        min: formatDuration(duration_metrics.min),
        mean: formatDuration(duration_metrics.mean),
        median: formatDuration(duration_metrics.median),
        p95: formatDuration(duration_metrics.p95),
        max: formatDuration(duration_metrics.max),
        standard_deviation: formatDuration(duration_metrics.standard_deviation),
      },
      total_recoveries,
    },
    window_start: new Date(window_start).toLocaleString(),
    window_end: new Date(window_end).toLocaleString(),
    project_id,
  };
}

/**
 * Formats duration in seconds to a human-readable string
 */
function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return 'N/A';
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`;
}
