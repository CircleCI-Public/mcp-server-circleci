import { z } from 'zod';

export const generateTestsForPromptTemplateInputSchema = z.object({
  template: z
    .string()
    .describe(
      'The prompt template to generate tests for. Use the latest prompt template from the latest `create_prompt_template` tool output.',
    ),
  contextSchema: z
    .record(z.string(), z.string())
    .describe(
      'The context schema for the prompt template. Use the context schema from the latest `create_prompt_template` tool output.',
    ),
});
