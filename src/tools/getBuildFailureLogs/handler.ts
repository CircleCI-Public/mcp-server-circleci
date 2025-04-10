import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getPipelineNumberFromURL,
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getBuildFailureOutputInputSchema } from './inputSchema.js';
import getPipelineJobLogs from '../../lib/pipeline-job-logs/getPipelineJobLogs.js';
import { formatJobLogs } from '../../lib/pipeline-job-logs/getJobLogs.js';

export const getBuildFailureLogs: ToolCallback<{
  params: typeof getBuildFailureOutputInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    failedPipelineURL,
    failedJobURL,
  } = args.params;

  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set');
  }

  const token = process.env.CIRCLECI_TOKEN;
  let projectSlug: string | null | undefined;
  let pipelineNumber: number | undefined;

  if (failedPipelineURL || failedJobURL) {
    const failedURL = (failedPipelineURL ?? failedJobURL)!;
    projectSlug = getProjectSlugFromURL(failedURL);
    pipelineNumber = parseInt(getPipelineNumberFromURL(failedURL));
  } else if (workspaceRoot && gitRemoteURL && branch) {
    projectSlug = await identifyProjectSlug({
      token,
      gitRemoteURL,
    });
  } else {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: 'No inputs provided. Ask the user to provide the inputs user can provide based on the tool description.',
        },
      ],
    };
  }

  if (!projectSlug) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `
          Project not found. Ask the user to provide the inputs user can provide based on the tool description.

          Project slug: ${projectSlug}
          Git remote URL: ${gitRemoteURL}
          Branch: ${branch}
          `,
        },
      ],
    };
  }

  const logs = await getPipelineJobLogs({
    projectSlug,
    branch,
    pipelineNumber,
  });

  return formatJobLogs(logs);
};
