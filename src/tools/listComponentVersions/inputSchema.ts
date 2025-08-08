import { z } from 'zod';
import { projectSlugDescriptionNoBranch } from '../shared/constants.js';

export const listComponentVersionsInputSchema = z.object({
  projectSlug: z
    .string()
    .describe(projectSlugDescriptionNoBranch)
    .optional(),
  projectID: z
    .string()
    .uuid()
    .describe('The ID of the CircleCI project (UUID)')
    .optional(),
  orgID: z
    .string()
    .describe(
      'The ID of the organization. This is the ID of the organization that the components and environments belong to. If not provided, it will be resolved from projectSlug or projectID.',
    )
    .optional(),
  componentID: z
    .string()
    .optional()
    .describe('The ID of the component to list versions for. If not provided, available components will be listed.'),
  environmentID: z
    .string()
    .optional()
    .describe('The ID of the environment to list versions for. If not provided, available environments will be listed.'),
}).refine(
  (data) => data.projectSlug || data.projectID,
  {
    message: "Either projectSlug or projectID must be provided",
    path: ["projectSlug", "projectID"],
  }
);
