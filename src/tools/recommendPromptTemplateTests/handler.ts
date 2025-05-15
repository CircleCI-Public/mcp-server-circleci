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
  - The file should be named in the format 'prompt_<relevant-name>.json' (e.g. 'prompt_bedtime-story-generator.json', 'prompt_plant-care-assistant.json', 'prompt_customer-support-chatbot.json', etc.)
  - The file should have the following keys:
    - \`name\`: string (the name of the prompt template)
    - \`description\`: string (a description of the prompt template)
    - \`version\`: string (the semantic version of the prompt template, eg "1.0.0")
    - \`template\`: string (the prompt template)
    - \`contextSchema\`: object (the \`contextSchema\`)
    - \`tests\`: array of objects (based on the \`recommendedTests\`)
      - \`name\`: string (a relevant "Title Case" name for the test, based on the content of the \`recommendedTests\` array item)
      - \`description\`: string (taken directly from string array item in \`recommendedTests\`)
    - \`sampleInputs\`: object[] (the sample inputs for the \`promptTemplate\` and any tests within \`recommendedTests\`)

RULES FOR SAVING FILES:
- Files should be written in the preferred language of the current repository.
- The file should be documented with a README description of what it does, and how it works.
  - If a README already exists, update it with the new information.
  - If a README does not exist, create one.
- The file should be formatted using the user's preferred conventions.
- The file should be saved in the './prompts' directory at the root of the project.
- Only save the following files (and nothing else):
  - \`prompt_<relevant-name>.json\`
  - \`README.md\`
`,
      },
    ],
  };
};
