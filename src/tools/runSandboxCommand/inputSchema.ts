import { z } from 'zod';

export const sandboxCommandInputSchema = z.object({
  sandboxID: z.string(),
  command: z.string(),
});
