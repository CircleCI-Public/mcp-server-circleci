import { z } from 'zod';

export const findUnderusedResourceClassesInputSchema = z.object({
  csvFilePath: z.string(), // Path to the usage data CSV file
  threshold: z.number().default(40).optional(), // Usage threshold percentage (default 40)
}); 