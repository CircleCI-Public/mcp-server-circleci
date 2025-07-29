import { z } from 'zod';

export const listDeployVersionsInputSchema = z.object({
  message: z
    .string()
    .describe(
      'A message to echo back to the user.',
    ),
});
