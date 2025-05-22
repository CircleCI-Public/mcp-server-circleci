import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { recommendPromptTemplateTestsInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';
import {
  fileExtension,
  fileNameExample1,
  fileNameExample2,
  fileNameExample3,
  fileNameTemplate,
  PromptOrigin,
  promptsOutputDirectory,
} from '../shared/types.js';

const promptTemplateKey = 'promptTemplate';
const modelKey = 'model';
const contextSchemaKey = 'contextSchema';
const promptOriginKey = 'promptOrigin';
const recommendedTestsKey = 'recommendedTests';

export const recommendPromptTemplateTests: ToolCallback<{
  params: typeof recommendPromptTemplateTestsInputSchema;
}> = async (args) => {
  const { template, contextSchema, promptOrigin } = args.params;

  const circlet = new CircletClient();
  const result = await circlet.circlet.recommendPromptTemplateTests({
    template,
    contextSchema,
  });

  const baseInstructions = `${recommendedTestsKey}: ${JSON.stringify(result, null, 2)}

NEXT STEP:
- Immediately save the \`${promptTemplateKey}\`, \`${contextSchemaKey}\`, and \`${recommendedTestsKey}\` to a single file containing the prompt template, context schema, and tests in a simple structured format (e.g. YAML, JSON, or whatever is most appropriate for the language of the current repository).
  - The ${fileExtension} file should be named in the format '${fileNameTemplate}' (e.g. '${fileNameExample1}', '${fileNameExample2}', '${fileNameExample3}', etc.)
  - The file should have the following keys:
    - \`name\`: string (the name of the prompt template)
    - \`description\`: string (a description of the prompt template)
    - \`version\`: string (the semantic version of the prompt template, e.g. "1.0.0")
    - \`${promptOriginKey}\`: string (the origin of the prompt template, e.g. "${PromptOrigin.codebase}" or "${PromptOrigin.requirements}")
    - \`${modelKey}\`: string (the model used for generating the prompt template and tests)
    - \`template\`: multi-line string (the prompt template)
    - \`${contextSchemaKey}\`: object (the \`${contextSchemaKey}\`)
    - \`tests\`: array of objects (based on the \`${recommendedTestsKey}\`)
      - \`name\`: string (a relevant "Title Case" name for the test, based on the content of the \`${recommendedTestsKey}\` array item)
      - \`description\`: string (taken directly from string array item in \`${recommendedTestsKey}\`)
    - \`sampleInputs\`: object[] (the sample inputs for the \`${promptTemplateKey}\` and any tests within \`${recommendedTestsKey}\`)

RULES FOR SAVING FILES:
- The files should be saved in the \`${promptsOutputDirectory}\` directory at the root of the project.
- Files should be written with respect to the prevailing conventions of the current repository.
- The prompt files should be documented with a README description of what they do, and how they work.
  - If a README already exists in the \`${promptsOutputDirectory}\` directory, update it with the new prompt template information.
  - If a README does not exist in the \`${promptsOutputDirectory}\` directory, create one.
- The files should be formatted using the user's preferred conventions.
- Only save the following files (and nothing else):
  - \`${fileNameTemplate}\`
  - \`README.md\``;

  const integrationInstructions =
    promptOrigin === PromptOrigin.codebase
      ? `

FINALLY, ONCE ALL THE FILES ARE SAVED:
- Ask the user if they'd like to integrate the newly-generated prompt template files into their application, as a more tested and trustworthy replacement for their pre-existing prompt implementations. A "Yes" or "No" response is perfectly acceptable.
- Ensure that the prompt files are integrated in the simplest, most intuitive and idiomatic manner possible, with respect to the prevailing conventions of the codebase.
- If any imports are added, ensure they are actually available in installed dependencies. DO NOT ADD ANY IMPORTS THAT ARE NOT ALREADY AVAILABLE AS INSTALLED DEPENDENCIES.
- The integration should be 100% error free and continue to be successfully built.`
      : '';

  return {
    content: [
      {
        type: 'text',
        text: baseInstructions + integrationInstructions,
      },
    ],
  };
};
