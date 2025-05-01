import { z } from 'zod';

export const createSandboxInputSchema = z.object({
  workspaceRoot: z.string(),
  gitRemoteURL: z.string(),
  projectURL: z.string(),
});
