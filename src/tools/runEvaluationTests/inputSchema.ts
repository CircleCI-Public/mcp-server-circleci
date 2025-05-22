import { z } from 'zod';

export const runEvaluationTestsInputSchema = z.object({
  projectSlug: z
    .string()
    .describe(
      'The project slug obtained from listFollowedProjects tool (e.g., "gh/organization/project").',
    ),
  tests: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .describe('Array of tests to run on the project'),
  sampleInputs: z
    .array(z.record(z.string(), z.string()))
    .describe('Array of sample inputs for the prompt template'),
});
