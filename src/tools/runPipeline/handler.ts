import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getBranchFromURL,
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { runPipelineInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIClient } from '../../clients/client.js';

export const runPipeline: ToolCallback<{
  params: typeof runPipelineInputSchema;
}> = async (args) => {
  const { workspaceRoot, gitRemoteURL, branch, projectURL } = args.params;

  let projectSlug: string | undefined;
  let branchFromURL: string | undefined;

  if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
    branchFromURL = getBranchFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL && branch) {
    projectSlug = await identifyProjectSlug({
      gitRemoteURL,
    });
  } else {
    return mcpErrorOutput(
      'No inputs provided. Ask the user to provide the inputs user can provide based on the tool description.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput(`
          Project not found. Ask the user to provide the inputs user can provide based on the tool description.

          Project slug: ${projectSlug}
          Git remote URL: ${gitRemoteURL}
          Branch: ${branch}
          `);
  }

  const foundBranch = branchFromURL || branch;

  // temporary
  console.log(projectSlug, foundBranch);

  if (!foundBranch) {
    return mcpErrorOutput(
      'No branch provided. Ask the user to provide the branch.',
    );
  }

  const circleci = getCircleCIClient();

  const runPipelineResponse = await circleci.pipelines.runPipeline({
    projectSlug,
    branch: foundBranch || 'main',
  });

  // TODO: get a pipeline URL and return it
  return {
    content: [
      {
        type: 'text',
        text: `Pipeline run successfully: ${runPipelineResponse.id}`,
      },
    ],
  };
};
