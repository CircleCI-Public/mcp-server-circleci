import { z } from 'zod';

export const createPromptTemplateInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      "The user's application, feature, or product requirements that will be used to generate a prompt template.",
    ),
});
