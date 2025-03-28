import { z } from 'zod';

export const nodeVersionInputSchema = z.object({});

export const getPipelineInputSchema = z.object({
  projectSlug: z.string(),
});

export const getPipelineByCommitInputSchema = z.object({
  projectSlug: z.string(),
  commit: z.string(),
  branch: z.string(),
});
