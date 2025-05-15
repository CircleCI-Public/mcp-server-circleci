import { z } from 'zod';

export const rerunWorkflowInputSchema = z.object({
  workflowId: z
    .string()
    .describe('This should be the workflowId of the workflow that need rerun.'),
});
