import { z } from 'zod';

export const getOrbDetailsInputSchema = z.object({
  orbSlug: z
    .string()
    .describe(
      'The orb identifier. Accepts either "namespace/name" (e.g., "circleci/slack") to get the latest version, or "namespace/name@version" (e.g., "circleci/slack@4.12.6") for a specific version.',
    ),
});
