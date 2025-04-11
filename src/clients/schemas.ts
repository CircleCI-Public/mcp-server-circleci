import { z } from 'zod';

const WorkflowMetricsSchema = z.object({
  name: z.string(),
  metrics: z.object({
    total_runs: z.number(),
    successful_runs: z.number(),
    mttr: z.number(),
    total_credits_used: z.number(),
    failed_runs: z.number(),
    success_rate: z.number(),
    duration_metrics: z.object({
      min: z.number(),
      mean: z.number(),
      median: z.number(),
      p95: z.number(),
      max: z.number(),
      standard_deviation: z.number(),
    }),
    total_recoveries: z.number(),
    throughput: z.number(),
  }),
  window_start: z.string(),
  window_end: z.string(),
  project_id: z.string().nullable(),
});

const JobMetricsSchema = z.object({
  name: z.string(),
  metrics: z.object({
    total_runs: z.number(),
    failed_runs: z.number(),
    successful_runs: z.number(),
    duration_metrics: z.object({
      min: z.number(),
      mean: z.number(),
      median: z.number(),
      p95: z.number(),
      max: z.number(),
      standard_deviation: z.number(),
    }),
    success_rate: z.number(),
    total_credits_used: z.number(),
    throughput: z.number(),
  }),
  window_start: z.string(),
  window_end: z.string(),
});

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

export const Test = TestSchema;
export type Test = z.infer<typeof TestSchema>;

export const PaginatedTestResponse = PaginatedTestResponseSchema;
export type PaginatedTestResponse = z.infer<typeof PaginatedTestResponseSchema>;

export const FlakyTest = FlakyTestSchema;
export type FlakyTest = z.infer<typeof FlakyTestSchema>;

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

export const WorkflowMetrics = WorkflowMetricsSchema;
export type WorkflowMetrics = z.infer<typeof WorkflowMetricsSchema>;

export const JobMetrics = JobMetricsSchema;
export type JobMetrics = z.infer<typeof JobMetricsSchema>;
