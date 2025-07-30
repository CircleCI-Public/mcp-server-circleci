import { z } from 'zod';
import {
  projectSlugDescription,
} from '../shared/constants.js';

export const runRollbackPipelineInputSchema = z.object({
  projectSlug: z.string().describe(projectSlugDescription).optional(),
  projectID: z.string().uuid().describe('The ID of the CircleCI project (UUID)').optional(),
  environment_name: z
    .string()
    .describe('The environment name')
    .optional(),
  component_name: z
    .string()
    .describe('The component name')
    .optional(),
  current_version: z
    .string()
    .describe('The current version')
    .optional(),
  target_version: z
    .string()
    .describe('The target version')
    .optional(),
  reason: z
    .string()
    .describe('The reason for the rollback')
    .optional(),
  parameters: z
    .record(z.any())
    .describe('The extra parameters for the rollback pipeline')
    .optional(),
});
