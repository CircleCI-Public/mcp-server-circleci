import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowFromFailedInputSchema } from './inputSchema.js';

export const rerunWorkflowFromFailed: ToolCallback<{
  params: typeof rerunWorkflowFromFailedInputSchema;
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
