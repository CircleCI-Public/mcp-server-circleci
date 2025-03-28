import { z } from 'zod';

export const nodeVersionInputSchema = z.object({});

export const getPipelineInputSchema = z.object({
  projectSlug: z.string(),
});
