import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { configHelperInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';

export const configHelper: ToolCallback<{
  params: typeof configHelperInputSchema;
}> = async (args) => {
  const { configFile } = args.params;

  const circleci = getCircleCIClient();
  const configValidate = await circleci.configValidate.validateConfig({
    config: configFile,
  });

  if (configValidate.valid) {
    return {
      content: [
        {
          type: 'text',
          text: 'Your config is valid!',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `There are some issues with your config: ${configValidate.errors?.map((error) => error.message).join('\n') ?? 'Unknown error'}`,
      },
    ],
  };
};
