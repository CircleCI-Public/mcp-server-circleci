import { z } from 'zod';

export const rerunWorkflowInputSchema = z.object({
  workflowId: z
    .string()
    .describe(
      'This should be the workflowId of the workflow that need rerun. The workflowId is an UUID. An example workflowId is a12145c5-90f8-4cc9-98f2-36cb85db9e4b',
    ),
});
