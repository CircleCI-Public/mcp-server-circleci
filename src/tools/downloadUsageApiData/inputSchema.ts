import { z } from 'zod';

export const downloadUsageApiDataInputSchema = z.object({
  orgId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  jobId: z.string().optional(),
  outputDir: z.string(),
}); 