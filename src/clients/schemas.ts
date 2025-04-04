import { z } from 'zod';

const FollowedProjectSchema = z.object({
  name: z.string(),
  slug: z.string(),
  vcs_type: z.string(),
});

const PipelineSchema = z.object({
  id: z.string(),
  project_slug: z.string(),
  number: z.number(),
});

const WorkflowSchema = z.object({
  id: z.string(),
});

const JobSchema = z.object({
  job_number: z.number(),
  id: z.string(),
});

const JobDetailsSchema = z.object({
  build_num: z.number(),
  steps: z.array(
    z.object({
      name: z.string(),
      actions: z.array(
        z.object({
          index: z.number(),
          step: z.number(),
          failed: z.boolean().nullable(),
        }),
      ),
    }),
  ),
  workflows: z.object({
    job_name: z.string(),
  }),
});

// Export the schemas and inferred types with the same names as the original types
export const Pipeline = PipelineSchema;
export type Pipeline = z.infer<typeof PipelineSchema>;

export const PaginatedPipelineResponseSchema = z.object({
  items: z.array(Pipeline),
  next_page_token: z.string().nullable(),
});
export type PaginatedPipelineResponse = z.infer<
  typeof PaginatedPipelineResponseSchema
>;

export const Workflow = WorkflowSchema;
export type Workflow = z.infer<typeof WorkflowSchema>;

export const Job = JobSchema;
export type Job = z.infer<typeof JobSchema>;

export const JobDetails = JobDetailsSchema;
export type JobDetails = z.infer<typeof JobDetailsSchema>;

export const FollowedProject = FollowedProjectSchema;
export type FollowedProject = z.infer<typeof FollowedProjectSchema>;
