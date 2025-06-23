import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';
import { CircletClient } from '../../clients/circlet/index.js';
import { PromptWorkbenchToolName } from '../shared/constants.js';

export const promptOriginKey = 'promptOrigin';
export const promptTemplateKey = 'promptTemplate';
export const contextSchemaKey = 'contextSchema';
export const modelKey = 'model';
export const temperatureKey = 'temperature';

export const createPromptTemplate: ToolCallback<{
  params: typeof createPromptTemplateInputSchema;
}> = async (args) => {
  const { prompt, promptOrigin, model } = args.params;

  const circlet = new CircletClient();
  const promptObject = await circlet.circlet.createPromptTemplate(
    prompt,
    promptOrigin,
  );

  return {
    content: [
      {
        type: 'text',
        text: `${promptOriginKey}: ${promptOrigin}

${promptTemplateKey}: ${promptObject.template}

${contextSchemaKey}: ${JSON.stringify(promptObject.contextSchema, null, 2)}

${modelKey}: ${model}

NEXT STEP:
- Immediately call the \`${PromptWorkbenchToolName.recommend_prompt_template_tests}\` tool with:
  - template: the \`${promptTemplateKey}\` above
  - ${contextSchemaKey}: the \`${contextSchemaKey}\` above
  - ${promptOriginKey}: the \`${promptOriginKey}\` above
  - ${modelKey}: the \`${modelKey}\` above
  - ${temperatureKey}: the \`${temperatureKey}\` above
`,
      },
    ],
  };
};
