import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIPrivateClient } from '../../clients/client.js';
import { listFollowedProjectsInputSchema } from './inputSchema.js';

export const listFollowedProjects: ToolCallback<{
  params: typeof listFollowedProjectsInputSchema;
}> = async () => {
  const circleciPrivate = getCircleCIPrivateClient();
  const followedProjects = await circleciPrivate.me.getFollowedProjects();

  const { projects, reachedMaxPagesOrTimeout } = followedProjects;

  if (projects.length === 0) {
    return mcpErrorOutput(
      'No projects found. Please make sure you have access to projects and have followed them.',
    );
  }

  const formattedProjectChoices = projects
    .map(
      (project, index) =>
        `${index + 1}. ${project.name} (projectSlug: ${project.slug})`,
    )
    .join('\n');

  let resultText = `Projects followed:\n${formattedProjectChoices}\n\nPlease have the user choose one of these projects by name or number. When they choose, you (the LLM) should extract and use the projectSlug (not the project name) associated with their chosen project for subsequent tool calls. This projectSlug is required for tools like get_build_failure_logs, getFlakyTests, and get_job_test_results.`;

  if (reachedMaxPagesOrTimeout) {
    resultText = `WARNING: Not all projects were included due to pagination limits or timeout.\n\n${resultText}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: resultText,
      },
    ],
  };
};
