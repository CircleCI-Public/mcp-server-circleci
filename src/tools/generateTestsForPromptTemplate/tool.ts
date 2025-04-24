import { generateTestsForPromptTemplateInputSchema } from './inputSchema.js';

export const generateTestsForPromptTemplateTool = {
  name: 'generate_tests_for_prompt_template' as const,
  description: `
  This tool is part of a toolchain to iterate on a prompt template.
  This tool helps generate tests for a prompt template.

  Parameters:
  - params: An object containing:
    - prompt: string - The user's feature requirements that will be used to generate a prompt template.

  Example usage:
  {
    "params": {
      "prompt": "Create an app that takes any topic and an age (in years), then renders a 1-minute bedtime story for a person of that age."
    }
  }

  The tool will return a structured prompt template that can be used to guide an AI assistant's response, along with a context schema that defines the expected input parameters.

  Tool output instructions:
    - The tool will return a {{template}} that reformulates the user's prompt into a more structured format.
    - It will also provide a {{contextSchema}} that defines the expected parameters for the template.

  Using the template and contextSchema, you can generate a script calling the OpenAI API to generate a response.
  Use the stack from the current repository to generate the script.
  `,
  inputSchema: generateTestsForPromptTemplateInputSchema,
};
