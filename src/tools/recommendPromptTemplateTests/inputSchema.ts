import { z } from 'zod';

export const recommendPromptTemplateTestsInputSchema = z.object({
  template: z
    .string()
    .describe(
      'The prompt template to be tested. Use the `promptTemplate` from the latest `create_prompt_template` tool output (if available).',
    ),
  contextSchema: z
    .record(z.string(), z.string())
    .describe(
      'The context schema that defines the expected input parameters for the prompt template. Use the `contextSchema` from the latest `create_prompt_template` tool output.',
    ),
});
