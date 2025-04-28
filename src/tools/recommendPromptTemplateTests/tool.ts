import { recommendPromptTemplateTestsInputSchema } from './inputSchema.js';

export const recommendPromptTemplateTestsTool = {
  name: 'recommend_prompt_template_tests' as const,
  description: `
  - This tool is part of a tool chain to generate and provide test cases for a prompt template.
  - This tool generates recommended tests for a given prompt template.

  Parameters:
  - params: object
    - promptTemplate: string (the prompt template to be tested)
    - contextSchema: object (the context schema that defines the expected input parameters for the prompt template)

  Example usage:
  {
    "params": {
      "promptTemplate": "The user wants a bedtime story about {{topic}} for a person of age {{age}} years old. Please craft a captivating tale that captivates their imagination and provides a delightful bedtime experience.",
      "contextSchema": {
        "topic": "string",
        "age": "number"
      }
    }
  }

  The tool will return a structured array of test cases that can be used to test the prompt template.

  Tool output instructions:
    - The tool will return an array of {{recommendedTests}} that can be used to test the prompt template.
  `,
  inputSchema: recommendPromptTemplateTestsInputSchema,
};
