import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';
import { recommendPromptTemplateTestsTool } from '../recommendPromptTemplateTests/tool.js';

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
        text: `promptTemplate: ${promptObject.template}
contextSchema: ${JSON.stringify(promptObject.contextSchema, null, 2)}

NEXT STEP:
- Immediately call the \`${recommendPromptTemplateTestsTool.name}\` tool to generate a list of recommended tests that can be used to test the prompt template.
`,
      },
    ],
  };
};
