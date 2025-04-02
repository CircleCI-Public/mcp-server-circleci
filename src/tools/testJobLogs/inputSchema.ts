import { z } from 'zod';

export const testJobLogsInputSchema = z.object({
  branch: z.string(),
  pipelineNumber: z.number().optional(),
});
