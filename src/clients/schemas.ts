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
  name: z.string(),
  status: z.string().nullable(),
  created_at: z.string(),
  stopped_at: z.string().nullable().optional(),
});

const JobSchema = z.object({
  job_number: z.number().optional(),
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

const FlakyTestSchema = z.object({
  flaky_tests: z.array(
    z.object({
      job_number: z.number(),
    }),
  ),
  total_flaky_tests: z.number(),
});

const TestSchema = z.object({
  message: z.string(),
  run_time: z.union([z.string(), z.number()]),
  file: z.string().optional(),
  result: z.string(),
  name: z.string(),
  classname: z.string(),
});

const PaginatedTestResponseSchema = z.object({
  items: z.array(TestSchema),
  next_page_token: z.string().nullable(),
});

const ConfigValidateSchema = z.object({
  valid: z.boolean(),
  errors: z
    .array(
      z.object({
        message: z.string(),
      }),
    )
    .nullable(),
  'output-yaml': z.string(),
  'source-yaml': z.string(),
});

export const Test = TestSchema;
export type Test = z.infer<typeof TestSchema>;

export const PaginatedTestResponse = PaginatedTestResponseSchema;
export type PaginatedTestResponse = z.infer<typeof PaginatedTestResponseSchema>;

export const FlakyTest = FlakyTestSchema;
export type FlakyTest = z.infer<typeof FlakyTestSchema>;

export const ConfigValidate = ConfigValidateSchema;
export type ConfigValidate = z.infer<typeof ConfigValidateSchema>;

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
