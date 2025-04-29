import { recommendPromptTemplateTestsTool } from '../recommendPromptTemplateTests/tool.js';
import { createPromptTemplateInputSchema } from './inputSchema.js';

const paramsKey = 'params';
const promptKey = 'prompt';
const templateVar = '`template`';
const contextSchemaVar = '`contextSchema`';

export const createPromptTemplateTool = {
  name: 'create_prompt_template' as const,
  description: `
  About this tool:
  - This tool is part of a tool chain that generates and provides test cases for a prompt template.
  - This tool helps an AI assistant to generate a prompt template based on feature requirements defined by a user.
  - This tool should be triggered whenever the user provides requirements for a new AI-enabled application or a new feature of an existing AI-enabled application (i.e. one that requires a prompt request to an LLM or any AI model).
  - This tool will return a structured prompt template (e.g. ${templateVar}) along with a context schema (e.g. ${contextSchemaVar}) that defines the expected input parameters for the prompt template.

  Parameters:
  - ${paramsKey}: object
    - ${promptKey}: string (the feature requirements that will be used to generate a prompt template)

  Example usage:
  {
    "${paramsKey}": {
      "${promptKey}": "Create an app that takes any topic and an age (in years), then renders a 1-minute bedtime story for a person of that age."
    }
  }

  The tool will return a structured prompt template that can be used to guide an AI assistant's response, along with a context schema that defines the expected input parameters.

  Tool output instructions:
  - The tool will return...
    - a ${templateVar} that reformulates the user's prompt into a more structured format.
    - a ${contextSchemaVar} that defines the expected input parameters for the template.
  - The tool output -- both the ${templateVar} and ${contextSchemaVar} -- will also be used as input to the \`${recommendPromptTemplateTestsTool.name}\` tool to generate a list of recommended tests that can be used to test the prompt template.
  `,
  inputSchema: createPromptTemplateInputSchema,
};
