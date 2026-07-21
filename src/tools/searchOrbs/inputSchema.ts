import { z } from 'zod';

export const searchOrbsInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'A keyword to search for in orb names (e.g., "slack", "aws", "kubernetes", "terraform"). Matches by substring on the orb name.',
    ),
});
