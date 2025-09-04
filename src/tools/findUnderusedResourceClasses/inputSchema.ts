import { z } from 'zod';

export const findUnderusedResourceClassesInputSchema = z.object({
  csvFilePath: z
    .string()
    .describe('The path to the usage data CSV file to analyze.'),
  threshold: z
    .number()
    .optional()
    .default(40)
    .describe(
      'The usage percentage threshold. Jobs with usage below this will be reported. Default is 40.',
    ),
});
