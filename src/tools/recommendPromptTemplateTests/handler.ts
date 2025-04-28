import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { recommendPromptTemplateTestsInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';

export const recommendPromptTemplateTests: ToolCallback<{
  params: typeof recommendPromptTemplateTestsInputSchema;
}> = async (args) => {
  const { template, contextSchema } = args.params;

  const circlet = new CircletClient();
  const result = await circlet.circlet.recommendPromptTemplateTests({
    template,
    contextSchema,
  });

  return {
    content: [
      {
        type: 'text',
        text: `recommendedTests: ${JSON.stringify(result, null, 2)}

NEXT STEP:
- Immediately save the \`recommendedTests\` to a file containing the tests in a simple JSON format.
`,
      },
    ],
  };
};
