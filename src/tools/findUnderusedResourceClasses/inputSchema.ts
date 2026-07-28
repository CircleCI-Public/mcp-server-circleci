import { z } from 'zod';

export const findUnderusedResourceClassesInputSchema = z.object({
  csvFilePath: z
    .union([z.string(), z.array(z.string())])
    .describe(
      'Path to a usage data CSV file, or an array of paths to multiple part files to analyze together. ' +
        'Must be inside the current working directory, the user home directory, or a temp directory. ' +
        'System paths and hidden config directories (e.g. "/etc", "~/.ssh") are rejected.',
    ),
  threshold: z
    .number()
    .optional()
    .default(40)
    .describe(
      'The usage percentage threshold. Jobs with usage below this will be reported. Default is 40.',
    ),
});
