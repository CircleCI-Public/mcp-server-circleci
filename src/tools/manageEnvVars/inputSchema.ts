import { z } from 'zod';
import { projectSlugDescriptionNoBranch } from '../shared/constants.js';

export const listEnvVarsInputSchema = z.object({
  projectSlug: z
    .string()
    .describe(projectSlugDescriptionNoBranch),
});

export const createEnvVarInputSchema = z.object({
  projectSlug: z
    .string()
    .describe(projectSlugDescriptionNoBranch),
  name: z
    .string()
    .describe('The name of the environment variable to create or update.'),
  value: z
    .string()
    .describe('The value of the environment variable.'),
});

export const deleteEnvVarInputSchema = z.object({
  projectSlug: z
    .string()
    .describe(projectSlugDescriptionNoBranch),
  name: z
    .string()
    .describe('The name of the environment variable to delete.'),
});
