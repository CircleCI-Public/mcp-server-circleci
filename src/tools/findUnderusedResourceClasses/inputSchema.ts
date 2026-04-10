import { z } from 'zod';

export const findUnderusedResourceClassesInputSchema = z.object({
  csvFilePath: z
    .union([z.string(), z.array(z.string())])
    .describe('Path to a usage data CSV file, or an array of paths to multiple part files to analyze together.'),
  threshold: z
    .number()
    .optional()
    .default(40)
    .describe(
      'The usage percentage threshold. Jobs with usage below this will be reported. Default is 40.',
    ),
});
