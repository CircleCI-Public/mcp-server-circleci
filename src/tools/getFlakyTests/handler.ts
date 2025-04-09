import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromProjectURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getFlakyTestLogsInputSchema } from './inputSchema.js';
import getFlakyTests from '../../lib/flaky-tests/getFlakyTests.js';

export const getFlakyTestLogs: ToolCallback<{
  params: typeof getFlakyTestLogsInputSchema;
}> = async (args) => {
  const { workspaceRoot, gitRemoteURL, projectURL } = args.params;

  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set');
  }

  const token = process.env.CIRCLECI_TOKEN;
  let projectSlug: string | null | undefined;

  if (projectURL) {
    projectSlug = getProjectSlugFromProjectURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL) {
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
          `,
        },
      ],
    };
  }

  const tests = await getFlakyTests({
    projectSlug,
  });

  return {
    isError: false,
    content: [
      {
        type: 'text' as const,
        text: tests.map((test) => test.message).join('\n'),
      },
    ],
  };
};
