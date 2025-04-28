import { recommendPromptTemplateTestsTool } from '../recommendPromptTemplateTests/tool.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';

const templateTag = '{{template}}';
const contextSchemaTag = '{{contextSchema}}';

export const createPromptTemplateTool = {
  name: 'create_prompt_template' as const,
  description: `
  About this tool:
  - This tool is part of a tool chain to generate and provide test cases for a prompt template.
  - The tool helps an AI assistant to generate a prompt template based on feature requirements defined by a user.
  - The tool should be triggered whenever the user provides requirements for a new AI-enabled application or a new feature of an existing AI-enabled application (i.e. one that requires a prompt request to an LLM or any AI model).
  - The tool will return a structured prompt template (e.g. ${templateTag}) along with a context schema (e.g. ${contextSchemaTag}) that defines the expected input parameters for the prompt template.

  Parameters:
  - params: object
    - prompt: string (the feature requirements that will be used to generate a prompt template)

  Example usage:
  {
    "params": {
      "prompt": "Create an app that takes any topic and an age (in years), then renders a 1-minute bedtime story for a person of that age."
    }
  }

  The tool will return a structured prompt template that can be used to guide an AI assistant's response, along with a context schema that defines the expected input parameters.

  Tool output instructions:
  - The tool will return a ${templateTag} that reformulates the user's prompt into a more structured format.
  - It will also provide a ${contextSchemaTag} that defines the expected parameters for the template.
  - The tool output -- both the ${templateTag} and ${contextSchemaTag} -- will also be used as input to the \`${recommendPromptTemplateTestsTool.name}\` tool to generate a list of recommended tests that can be used to test the prompt template.
  `,
  inputSchema: createPromptTemplateInputSchema,
};
