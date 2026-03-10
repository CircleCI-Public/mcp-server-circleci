import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  listEnvVarsInputSchema,
  createEnvVarInputSchema,
  deleteEnvVarInputSchema,
} from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIClient } from '../../clients/client.js';

export const listEnvVars: ToolCallback<{
  params: typeof listEnvVarsInputSchema;
}> = async (args) => {
  const { projectSlug } = args.params ?? {};

  if (!projectSlug) {
    return mcpErrorOutput(
      'Missing required parameter: projectSlug. Use listFollowedProjects to find your project slug.',
    );
  }

  const circleci = getCircleCIClient();
  const response = await circleci.envVars.listEnvVars({ projectSlug });

  if (!response.items || response.items.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No environment variables found for project ${projectSlug}.`,
        },
      ],
    };
  }

  const envVarList = response.items
    .map((envVar) => `- ${envVar.name}: ${envVar.value}`)
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Environment variables for ${projectSlug}:\n\n${envVarList}`,
      },
    ],
  };
};

export const createEnvVar: ToolCallback<{
  params: typeof createEnvVarInputSchema;
}> = async (args) => {
  const { projectSlug, name, value } = args.params ?? {};

  if (!projectSlug) {
    return mcpErrorOutput(
      'Missing required parameter: projectSlug. Use listFollowedProjects to find your project slug.',
    );
  }

  if (!name) {
    return mcpErrorOutput('Missing required parameter: name.');
  }

  if (!value) {
    return mcpErrorOutput('Missing required parameter: value.');
  }

  const circleci = getCircleCIClient();
  const result = await circleci.envVars.createEnvVar({
    projectSlug,
    name,
    value,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Environment variable "${result.name}" created successfully for project ${projectSlug}. Masked value: ${result.value}`,
      },
    ],
  };
};

export const deleteEnvVar: ToolCallback<{
  params: typeof deleteEnvVarInputSchema;
}> = async (args) => {
  const { projectSlug, name } = args.params ?? {};

  if (!projectSlug) {
    return mcpErrorOutput(
      'Missing required parameter: projectSlug. Use listFollowedProjects to find your project slug.',
    );
  }

  if (!name) {
    return mcpErrorOutput('Missing required parameter: name.');
  }

  const circleci = getCircleCIClient();
  await circleci.envVars.deleteEnvVar({ projectSlug, name });

  return {
    content: [
      {
        type: 'text',
        text: `Environment variable "${name}" deleted successfully from project ${projectSlug}.`,
      },
    ],
  };
};
