import { z } from 'zod';

export const findUnderusedResourceClassesInputSchema = z.object({
  csvFilePath: z.string(),
  threshold: z.number().default(40).optional(),
}); 