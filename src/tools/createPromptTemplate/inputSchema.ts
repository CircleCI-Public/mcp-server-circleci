import { z } from 'zod';

export const createPromptTemplateInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      "The user's prompt or query that will be used to generate a template.",
    ),
});
