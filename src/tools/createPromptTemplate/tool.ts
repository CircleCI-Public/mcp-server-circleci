import { createPromptTemplateInputSchema } from './inputSchema.js';

export const createPromptTemplateTool = {
  name: 'create_prompt_template' as const,
  description: `
  This tool helps create a prompt template based on feature requirements for an AI assistant.

  Parameters:
  - params: An object containing:
    - prompt: string - The user's prompt or query that will be used to generate a template.

  Example usage:
  {
    "params": {
      "prompt": "generate me a story about a cat"
    }
  }

  The tool will return a structured template that can be used to guide an AI assistant's response,
  along with a context schema that defines the expected input parameters.

  Tool output instructions:
    - The tool will return a template that reformulates the user's prompt into a more structured format
    - It will also provide a contextSchema that defines the expected parameters for the template
  `,
  inputSchema: createPromptTemplateInputSchema,
};
