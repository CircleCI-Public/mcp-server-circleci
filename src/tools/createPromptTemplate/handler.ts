import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const createPromptTemplate: ToolCallback<{
  params: typeof createPromptTemplateInputSchema;
}> = async (args) => {
  const { prompt } = args.params;

  const circlet = new CircletClient();
  const result = await circlet.circlet.createPromptTemplate(prompt);

  if (!result.success) {
    return mcpErrorOutput(
      `Failed to create prompt template: ${result.error.message}, prompt: ${prompt}`,
    );
  }

  return {
    content: [
      {
        type: 'text',
        text: `The prompt template is: ${result.data?.workbench.template}. Context Schema: ${JSON.stringify(result.data?.workbench.contextSchema)}`,
      },
    ],
  };
};
