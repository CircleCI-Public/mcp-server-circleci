import { z } from 'zod';
import { projectSlugDescriptionNoBranch } from '../shared/constants.js';

export const runRollbackPipelineInputSchema = z.object({
  projectSlug: z
    .string()
    .describe(projectSlugDescriptionNoBranch)
    .optional(),
  projectID: z
    .string()
    .uuid()
    .describe('The ID of the CircleCI project (UUID)')
    .optional(),
  environmentName: z
    .string()
    .describe('The environment name'),
  componentName: z
    .string()
    .describe('The component name'),
  currentVersion: z
    .string()
    .describe('The current version'),
  targetVersion: z
    .string()
    .describe('The target version'),
  namespace: z
    .string()
    .describe('The namespace of the component'),
  reason: z
    .string()
    .describe('The reason for the rollback')
    .optional(),
  parameters: z
    .record(z.any())
    .describe('The extra parameters for the rollback pipeline')
    .optional(),
}).refine(
  (data) => data.projectSlug || data.projectID,
  {
    message: "Either projectSlug or projectID must be provided",
    path: ["projectSlug", "projectID"],
  }
);
