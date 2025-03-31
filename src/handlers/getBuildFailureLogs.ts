import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getBuildFailureOutputInputSchema } from '../toolsSchemas/getBuildFailureOutputInputSchema.js';
import {
  getPipelineNumberFromURL,
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../lib/project-detection/index.js';

export const getBuildFailureLogs: ToolCallback<{
  params: typeof getBuildFailureOutputInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    failedPipelineURL,
    failedJobURL,
    organization,
    project_name,
  } = args.params;

  if (!process.env.CIRCLE_TOKEN) {
    throw new Error('CIRCLE_TOKEN is not set');
  }

  const token = process.env.CIRCLE_TOKEN;

  if (failedPipelineURL || failedJobURL) {
    const projectSlug = getProjectSlugFromURL(failedPipelineURL ?? '');
    const pipelineNumber = getPipelineNumberFromURL(failedPipelineURL ?? '');

    // TODO: Get the pipeline failure logs using the project slug and pipeline number

    return {
      content: [
        {
          type: 'text' as const,
          text: `
          > hungry-panda@0.1.0 build
          > next buildss

          "next buildss" does not exist. Did you mean "next build"?

          Exited with code exit status 1
          In case of urls.

          Project slug: ${projectSlug}
          Pipeline number: ${pipelineNumber}
          `,
        },
      ],
    };
  } else if (
    workspaceRoot &&
    gitRemoteURL &&
    branch &&
    organization &&
    project_name
  ) {
    const projectSlug = await identifyProjectSlug(token);

    if (!projectSlug) {
      throw new Error('Project not found');
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `
          > hungry-panda@0.1.0 build
          > next buildss

          "next buildss" does not exist. Did you mean "next build"?

          Exited with code exit status 1
          In case of non urls.
          `,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: 'No inputs provided. Ask the user to provide the inputs user can provide based on the tool description.',
      },
    ],
  };
};
