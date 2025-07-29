import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listDeployVersionsInputSchema } from './inputSchema.js';

export const listDeployVersions: ToolCallback<{
  params: typeof listDeployVersionsInputSchema;
}> = async (args) => {
  const { message } = args.params;

  return {
    content: [
      {
        type: 'text',
        text: `Received message: ${message}`,
      },
    ],
  };
};
