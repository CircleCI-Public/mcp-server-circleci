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
- Immediately save the \`promptTemplate\`, \`contextSchema\`, and \`recommendedTests\` to a single file containing the prompt template, context schema, and tests in a simple structured format (e.g. JSON, YAML, or whatever is most appropriate for the language of the current repository).

RULES FOR SAVING FILES:
- Files should be written in the preferred language of the current repository.
- The file should be documented with a README description of what it does, and how it works.
- The file should be formatted using the user's preferred conventions.
- The file should be saved in the '.circleci/ai/prompts' directory.
- The file should be named in the format 'prompt_<relevant-name>.json' (e.g. 'prompt_bedtime-story-generator.json', 'prompt_plant-care-assistant.json', 'prompt_customer-support-chatbot.json', etc.)
`,
      },
    ],
  };
};
