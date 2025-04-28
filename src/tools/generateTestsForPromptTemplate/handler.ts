import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateTestsForPromptTemplateInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';

export const generateTestsForPromptTemplate: ToolCallback<{
  params: typeof generateTestsForPromptTemplateInputSchema;
}> = async (args) => {
  const { template, contextSchema } = args.params;

  const circlet = new CircletClient();
  const result = await circlet.circlet.generateTestsForPromptTemplate({
    template,
    contextSchema,
  });

  return {
    content: [
      {
        type: 'text',
        text: `recommendedTests: ${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
};
