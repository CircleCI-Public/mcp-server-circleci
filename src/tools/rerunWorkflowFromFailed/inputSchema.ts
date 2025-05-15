import { z } from 'zod';

export const rerunWorkflowFromFailedInputSchema = z.object({
  workflowId: z
    .string()
    .describe('This should be the workflowId of the workflow that failed.'),
});
