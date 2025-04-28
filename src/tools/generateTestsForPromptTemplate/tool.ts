import { generateTestsForPromptTemplateInputSchema } from './inputSchema.js';

export const generateTestsForPromptTemplateTool = {
  name: 'generate_tests_for_prompt_template' as const,
  description: `
  - This tool is part of a tool chain to generate and provide test cases for a prompt template.
  - This tool generates recommended tests for a given prompt template.

  Parameters:
  - params: object
    - prompt: string (the prompt template to be tested)

  Example usage:
  {
    "params": {
      "prompt": "The user wants a bedtime story about {{topic}} for a person of age {{age}} years old. Please craft a captivating tale that captivates their imagination and provides a delightful bedtime experience."
    }
  }

  The tool will return a structured array of test cases that can be used to test the prompt template.

  Tool output instructions:
    - The tool will return an array of {{recommendedTests}} that can be used to test the prompt template.
  `,
  inputSchema: generateTestsForPromptTemplateInputSchema,
};
