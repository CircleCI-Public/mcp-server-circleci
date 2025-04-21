import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';

export const createPromptTemplate: ToolCallback<{
  params: typeof createPromptTemplateInputSchema;
}> = async (args) => {
  const { prompt } = args.params;

  return {
    content: [
      {
        type: 'text',
        text: `The prompt template is: ${prompt}`,
      },
    ],
  };
};
