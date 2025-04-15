import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { configHelperInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';

export const configHelper: ToolCallback<{
  params: typeof configHelperInputSchema;
}> = async (args) => {
  const { configFile } = args.params;

  console.error(configFile);

  const circleci = getCircleCIClient();

  // verify the config file is valid
  // const config = yaml.parse(configFile);
  // then validate on cci api
  const configValidate = await circleci.configValidate.validateConfig({
    config: configFile,
  });

  console.error(configValidate);

  return {
    content: [
      {
        type: 'text',
        text: 'Hello, world!',
      },
    ],
  };
};
