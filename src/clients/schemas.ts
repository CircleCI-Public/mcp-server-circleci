import { z } from 'zod';

type ContextSchema = {
  [k: string]: 'string' | 'number' | 'boolean' | 'date' | ContextSchema;
};

const contextSchemaSchema: z.ZodSchema<ContextSchema> = z.lazy(() =>
  z
    .record(
      z.union([
        contextSchemaSchema,
        z
          .enum(['string', 'number', 'boolean', 'date'])
          .describe('a primitive data type: string, number, boolean, or date'),
      ]),
    )
    .describe(
      'a schema structure, mapping keys to a primitive type (string, number, boolean, or date) or recursively to a nested schema',
    ),
);

const promptObjectSchema = z
  .object({
    template: z.string().describe('a mustache template string'),
    contextSchema: contextSchemaSchema.describe(
      'an arbitrarily nested map of variable names from the mustache template to primitive types (string, number, or boolean)',
    ),
  })
  .describe(
    'a complete prompt template with a template string and a context schema',
  );

const RuleReviewSchema = z.object({
  isRuleCompliant: z.boolean(),
  relatedRules: z.object({
    compliant: z.array(
      z.object({
        rule: z.string(),
        reason: z.string(),
        confidence_score: z.number(),
      }),
    ),
    violations: z.array(
      z.object({
        rule: z.string(),
        reason: z.string(),
        confidence_score: z.number(),
        violation_instances: z.array(
          z.object({
            line_numbers_in_diff: z.array(z.string()),
            violating_code_snippet: z.string(),
            explanation_of_violation: z.string(),
          }),
        ),
      }),
    ),
    requiresHumanReview: z.array(
      z.object({
        rule: z.string(),
        reason: z.string(),
        confidence_score: z.number(),
        human_review_required: z.object({
          points_of_ambiguity: z.array(z.string()),
          questions_for_manual_reviewer: z.array(z.string()),
        }),
      }),
    ),
  }),
  unrelatedRules: z.array(z.string()),
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
  name: z.string(),
  status: z.string().nullable(),
  created_at: z.string(),
  stopped_at: z.string().nullable().optional(),
  pipeline_number: z.number(),
  project_slug: z.string(),
  pipeline_id: z.string(),
});

const RerunWorkflowSchema = z.object({
  workflow_id: z.string(),
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

const RunPipelineResponseSchema = z.object({
  number: z.number(),
});

const ProjectSchema = z.object({
  id: z.string(),
});

const PipelineDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const PipelineDefinitionsResponseSchema = z.object({
  items: z.array(PipelineDefinitionSchema),
});

export const PipelineDefinition = PipelineDefinitionSchema;
export type PipelineDefinition = z.infer<typeof PipelineDefinitionSchema>;

export const PipelineDefinitionsResponse = PipelineDefinitionsResponseSchema;
export type PipelineDefinitionsResponse = z.infer<
  typeof PipelineDefinitionsResponseSchema
>;

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

export const RunPipelineResponse = RunPipelineResponseSchema;
export type RunPipelineResponse = z.infer<typeof RunPipelineResponseSchema>;

export const Project = ProjectSchema;
export type Project = z.infer<typeof ProjectSchema>;

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

export const PromptObject = promptObjectSchema;
export type PromptObject = z.infer<typeof PromptObject>;

export const RerunWorkflow = RerunWorkflowSchema;
export type RerunWorkflow = z.infer<typeof RerunWorkflowSchema>;

export const RuleReview = RuleReviewSchema;
export type RuleReview = z.infer<typeof RuleReviewSchema>;
