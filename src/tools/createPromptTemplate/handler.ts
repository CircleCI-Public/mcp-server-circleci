import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';
export const createPromptTemplate: ToolCallback<{
  params: typeof createPromptTemplateInputSchema;
}> = async (args) => {
  const { prompt } = args.params;

  const circlet = new CircletClient();
  const result = await circlet.circlet.generate(prompt);

  return {
    content: [
      {
        type: 'text',
        text: `The prompt template is: ${prompt}`,
      },
    ],
  };
};
