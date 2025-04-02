import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getPipelineNumberFromURL,
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getBuildFailureOutputInputSchema } from './inputSchema.js';
import getJobLogs from '../../lib/job-logs/getJobLogs.js';

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

  if (!process.env.CIRCLE_TOKEN) {
    throw new Error('CIRCLE_TOKEN is not set');
  }

  const token = process.env.CIRCLE_TOKEN;
  let projectSlug: string | null | undefined;
  let pipelineNumber: number | undefined;

  if (failedPipelineURL || failedJobURL) {
    projectSlug = getProjectSlugFromURL(failedPipelineURL ?? '');
    pipelineNumber = parseInt(
      getPipelineNumberFromURL(failedPipelineURL ?? ''),
    );
  } else if (workspaceRoot && gitRemoteURL && branch) {
    projectSlug = await identifyProjectSlug({
      token,
      gitRemoteURL,
    });
  } else {
    return {
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

  const logs = await getJobLogs({
    projectSlug,
    branch,
    pipelineNumber,
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: logs
          .map(
            (log) =>
              log.jobName +
              '\n' +
              log.steps
                .map(
                  (step) => step?.stepName + '\n' + JSON.stringify(step?.logs),
                )
                .join('\n'),
          )
          .join('\n'),
      },
    ],
  };
};
