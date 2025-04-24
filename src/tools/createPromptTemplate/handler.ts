import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';

export const createPromptTemplate: ToolCallback<{
  params: typeof createPromptTemplateInputSchema;
}> = async (args) => {
  const { prompt } = args.params;

  const circlet = new CircletClient();
  const promptObject = await circlet.circlet.createPromptTemplate(prompt);

  return {
    content: [
      {
        type: 'text',
        text: `The prompt template is: ${promptObject.template}. Context Schema: ${JSON.stringify(promptObject.contextSchema)}`,
      },
    ],
  };
};
