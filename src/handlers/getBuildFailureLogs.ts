import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as toolsSchemas from '../toolsSchemas/index.js';

export const getBuildFailureLogs: ToolCallback<{
  params: typeof toolsSchemas.getBuildFailureOutputInputSchema;
}> = (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    failedPipelineURL,
    failedJobURL,
    organization,
    project_name,
  } = args.params;

  if (workspaceRoot && gitRemoteURL && branch && organization && project_name) {
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
  } else if (failedPipelineURL || failedJobURL) {
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
