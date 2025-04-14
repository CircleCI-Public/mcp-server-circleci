import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CircleCIClients } from '../../clients/circleci/index.js';
import {
  getProjectSlugFromProjectURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { projectWorkflowTestMetricsInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { WorkflowTestMetrics } from '../../clients/schemas.js';

export const projectWorkflowTestMetrics: ToolCallback<{
  params: typeof projectWorkflowTestMetricsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    projectURL,
    workflowName,
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
      allBranches?: boolean;
      branch?: string;
    } = {};

    // Handle branch filtering - either all branches or specific branch
    if (allBranches) {
      options.allBranches = true;
    } else if (branch) {
      options.branch = branch;
    }

    // Get test metrics for the workflow
    const testMetrics = await circleci.insights.getWorkflowTestMetrics({
      projectSlug,
      workflowName,
      options,
    });

    // Format the response according to MCP format
    return {
      content: [
        {
          type: 'text',
          text: `Successfully retrieved test metrics for workflow "${workflowName}" in project ${projectSlug}.`,
        },
        {
          type: 'text',
          text: formatTestMetrics(testMetrics),
        },
      ],
    };
  } catch (error) {
    return mcpErrorOutput(
      `Error retrieving test metrics: ${(error as Error).message}`,
    );
  }
};

/**
 * Formats test metrics into a readable string
 */
function formatTestMetrics(metrics: WorkflowTestMetrics): string {
  let result = '## Test Metrics Summary\n\n';

  // Basic metrics
  result += `- **Average Test Count**: ${metrics.average_test_count}\n`;
  result += `- **Total Test Runs**: ${metrics.total_test_runs}\n\n`;

  // Most failed tests
  result += '## Most Failed Tests\n\n';
  if (metrics.most_failed_tests.length === 0) {
    result += 'No failing tests found.\n\n';
  } else {
    result +=
      '| Test Name | Class Name | File | Job Name | Failure Rate | Flaky |\n';
    result +=
      '|-----------|------------|------|----------|--------------|--------|\n';
    metrics.most_failed_tests.forEach((test) => {
      const failureRate = test.failed_runs
        ? ((test.failed_runs / test.total_runs) * 100).toFixed(2)
        : 'N/A';
      result += `| ${test.test_name} | ${test.classname || 'N/A'} | ${test.file || 'N/A'} | ${test.job_name} | ${failureRate}% | ${test.flaky ? '✓' : '-'} |\n`;
    });

    if (metrics.most_failed_tests_extra > 0) {
      result += `\n*${metrics.most_failed_tests_extra} additional tests with the same failure rate are not shown.*\n`;
    }
    result += '\n';
  }

  // Slowest tests
  result += '## Slowest Tests\n\n';
  if (metrics.slowest_tests.length === 0) {
    result += 'No test duration data available.\n\n';
  } else {
    result +=
      '| Test Name | Class Name | File | Job Name | P95 Duration | Total Runs |\n';
    result +=
      '|-----------|------------|------|----------|--------------|------------|\n';
    metrics.slowest_tests.forEach((test) => {
      result += `| ${test.test_name} | ${test.classname || 'N/A'} | ${test.file || 'N/A'} | ${test.job_name} | ${test.p95_duration ? formatDuration(test.p95_duration) : 'N/A'} | ${test.total_runs} |\n`;
    });

    if (metrics.slowest_tests_extra > 0) {
      result += `\n*${metrics.slowest_tests_extra} additional tests with similar duration are not shown.*\n`;
    }
    result += '\n';
  }

  // Test runs summary
  result += '## Recent Test Runs\n\n';
  result += '| Pipeline # | Success Rate | Test Counts |\n';
  result += '|------------|--------------|-------------|\n';
  metrics.test_runs.forEach((run) => {
    const successRate = run.success_rate
      ? (run.success_rate * 100).toFixed(2)
      : 'N/A';
    const testCounts = Object.entries(run.test_counts as Record<string, number>)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    result += `| ${run.pipeline_number} | ${successRate}% | ${testCounts} |\n`;
  });

  return result;
}

/**
 * Formats duration in seconds to a human-readable string
 */
function formatDuration(seconds: number): string {
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
