import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromURL,
  identifyProjectSlug,
  getJobNumberFromURL,
  getBranchFromURL,
  getPipelineNumberFromURL,
} from '../../lib/project-detection/index.js';
import { getJobTestResultsInputSchema } from './inputSchema.js';
import { getJobTests } from '../../lib/pipeline-job-tests/getJobTests.js';
import { formatJobTests } from '../../lib/pipeline-job-tests/formatJobTests.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const getJobTestResults: ToolCallback<{
  params: typeof getJobTestResultsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    projectURL,
    filterByTestsResult,
    projectSlug: inputProjectSlug,
  } = args.params;

  let pipelineNumber: number | undefined;
  let projectSlug: string | undefined;
  let jobNumber: number | undefined;
  let branchFromURL: string | undefined;

  if (inputProjectSlug) {
    if (!branch) {
      return mcpErrorOutput(
        'Branch not provided. When using projectSlug, a branch must also be specified.',
      );
    }
    projectSlug = inputProjectSlug;
  } else if (projectURL) {
    pipelineNumber = getPipelineNumberFromURL(projectURL);
    projectSlug = getProjectSlugFromURL(projectURL);
    branchFromURL = getBranchFromURL(projectURL);
    jobNumber = getJobNumberFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL && branch) {
    projectSlug = await identifyProjectSlug({
      gitRemoteURL,
    });
  } else {
    return mcpErrorOutput(
      'Missing required inputs. Please provide either: 1) projectSlug with branch, 2) projectURL, or 3) workspaceRoot with gitRemoteURL and branch.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput(`
      Project not found. Please provide a valid project URL or project information.

      Project slug: ${projectSlug}
      Git remote URL: ${gitRemoteURL}
      Branch: ${branch}
    `);
  }

  const testResults = await getJobTests({
    projectSlug,
    pipelineNumber,
    branch: branchFromURL || branch,
    jobNumber,
    filterByTestsResult,
  });

  return formatJobTests(testResults);
};
