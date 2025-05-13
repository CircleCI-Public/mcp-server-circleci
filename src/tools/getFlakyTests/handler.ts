import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getFlakyTestLogsInputSchema } from './inputSchema.js';
import getFlakyTests, {
  formatFlakyTests,
} from '../../lib/flaky-tests/getFlakyTests.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const getFlakyTestLogs: ToolCallback<{
  params: typeof getFlakyTestLogsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    projectURL,
    projectSlug: inputProjectSlug,
  } = args.params;

  let projectSlug: string | null | undefined;

  if (inputProjectSlug) {
    projectSlug = inputProjectSlug;
  } else if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL) {
    projectSlug = await identifyProjectSlug({
      gitRemoteURL,
    });
  } else {
    return mcpErrorOutput(
      'Missing required inputs. Please provide either: 1) projectSlug, 2) projectURL, or 3) workspaceRoot with gitRemoteURL.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput(`
          Project not found. Ask the user to provide the inputs user can provide based on the tool description.

          Project slug: ${projectSlug}
          Git remote URL: ${gitRemoteURL}
          `);
  }

  const tests = await getFlakyTests({
    projectSlug,
  });

  return formatFlakyTests(tests);
};
