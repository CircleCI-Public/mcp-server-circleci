import { z } from 'zod';
import { workflowUrlDescription } from '../shared/constants.js';

export const getSshDetailsInputSchema = z.object({
  workflowId: z
    .string()
    .describe(
      'The workflowId (UUID) of the workflow containing the SSH-enabled job. Example: a12145c5-90f8-4cc9-98f2-36cb85db9e4b',
    )
    .optional(),
  workflowURL: z.string().describe(workflowUrlDescription).optional(),
  jobNumber: z
    .number()
    .describe(
      'Optional job number. If omitted, automatically finds the last job with SSH enabled in the workflow.',
    )
    .optional(),
});
