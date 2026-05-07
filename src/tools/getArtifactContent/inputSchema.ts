import { z } from 'zod';

export const getArtifactContentInputSchema = z.object({
  artifactURL: z
    .string()
    .describe(
      'The URL of the CircleCI artifact to fetch. Obtain this from the list_artifacts tool.',
    ),
});
