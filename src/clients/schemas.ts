import { z } from 'zod';

const FollowedProjectSchema = z.object({
  default_branch: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  organization_id: z.string(),
  organization_name: z.string(),
  slug: z.string(),
  vcs_type: z.string(),
});

const PipelineSchema = z.object({
  id: z.string(),
  errors: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
    }),
  ),
  project_slug: z.string(),
  updated_at: z.string(),
  number: z.number(),
  state: z.enum(['created', 'errored', 'setup-pending', 'setup', 'pending']),
  created_at: z.string(),
  trigger: z.object({
    type: z.string(),
    received_at: z.string(),
    actor: z.object({
      login: z.string(),
      avatar_url: z.string().nullable(),
    }),
  }),
  trigger_parameters: z
    .object({
      circleci: z
        .object({
          event_action: z.string().optional(),
          event_time: z.string().optional(),
          provider_actor_id: z.string().optional(),
          provider_name: z.string().optional(),
          provider_login: z.string().optional(),
          actor_id: z.string().optional(),
          event_type: z.string().optional(),
          trigger_type: z.string().optional(),
        })
        .optional()
        .nullable(),
      github_app: z
        .object({
          web_url: z.string().optional(),
          commit_author_name: z.string().optional(),
          owner: z.string().optional(),
          user_id: z.string().optional(),
          full_ref: z.string().optional(),
          user_name: z.string().optional(),
          pull_request_merged: z.string().optional(),
          forced: z.string().optional(),
          user_username: z.string().optional(),
          branch: z.string().optional(),
          content_ref: z.string().optional(),
          repo_id: z.string().optional(),
          commit_title: z.string().optional(),
          commit_message: z.string().optional(),
          total_commits_count: z.string().optional(),
          repo_url: z.string().optional(),
          user_avatar: z.string().optional(),
          pull_request_draft: z.string().optional(),
          ref: z.string().optional(),
          repo_name: z.string().optional(),
          commit_author_email: z.string().optional(),
          checkout_sha: z.string().optional(),
          commit_timestamp: z.string().optional(),
          default_branch: z.string().optional(),
          repo_full_name: z.string().optional(),
          commit_sha: z.string().optional(),
        })
        .optional()
        .nullable(),
      git: z
        .object({
          commit_author_name: z.string().optional(),
          repo_owner: z.string().optional(),
          branch: z.string().optional(),
          commit_message: z.string().optional(),
          repo_url: z.string().optional(),
          ref: z.string().optional(),
          author_avatar_url: z.string().optional(),
          checkout_url: z.string().optional(),
          author_login: z.string().optional(),
          repo_name: z.string().optional(),
          commit_author_email: z.string().optional(),
          checkout_sha: z.string().optional(),
          default_branch: z.string().optional(),
        })
        .optional()
        .nullable(),
      webhook: z
        .object({
          body: z.string().optional(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
  vcs: z
    .object({
      provider_name: z.string(),
      target_repository_url: z.string(),
      branch: z.string().optional(),
      review_id: z.string().optional(),
      review_url: z.string().optional(),
      revision: z.string(),
      tag: z.string().optional(),
      commit: z
        .object({
          subject: z.string(),
          body: z.string(),
        })
        .optional(),
    })
    .optional(),
});

const WorkflowSchema = z.object({
  pipeline_id: z.string(),
  id: z.string(),
  name: z.string(),
  project_slug: z.string(),
  status: z.enum([
    'success',
    'running',
    'not_run',
    'failed',
    'error',
    'failing',
    'on_hold',
    'canceled',
    'unauthorized',
  ]),
  started_by: z.string(),
  pipeline_number: z.number(),
  created_at: z.string(),
  stopped_at: z.string(),
});

const JobSchema = z.object({
  job_number: z.number(),
  stopped_at: z.string(),
  started_at: z.string(),
  name: z.string(),
  project_slug: z.string().optional(),
  type: z.string().optional(),
  requires: z.record(z.unknown()).optional(),
  status: z.enum([
    'success',
    'running',
    'not_run',
    'failed',
    'error',
    'failing',
    'on_hold',
    'canceled',
    'unauthorized',
  ]),
  id: z.string(),
  dependencies: z.array(z.string()).optional(),
});

const JobDetailsSchema = z.object({
  all_commit_details: z.array(
    z.object({
      author_date: z.string().nullable(),
      author_email: z.string(),
      author_login: z.string(),
      author_name: z.string(),
      body: z.string(),
      branch: z.string(),
      commit: z.string(),
      commit_url: z.string(),
      committer_date: z.string().nullable(),
      committer_email: z.string().nullable(),
      committer_login: z.string().nullable(),
      committer_name: z.string().nullable(),
      subject: z.string(),
    }),
  ),
  all_commit_details_truncated: z.boolean(),
  author_date: z.string().nullable(),
  author_email: z.string(),
  author_name: z.string(),
  body: z.string(),
  branch: z.string(),
  build_num: z.number(),
  build_parameters: z.record(z.unknown()),
  build_time_millis: z.number(),
  build_url: z.string(),
  canceled: z.boolean(),
  canceler: z.string().nullable(),
  circle_yml: z.object({
    string: z.string(),
  }),
  committer_date: z.string().nullable(),
  committer_email: z.string().nullable(),
  committer_name: z.string().nullable(),
  compare: z.string().nullable(),
  context_ids: z.array(z.string()),
  dont_build: z.string().nullable(),
  fail_reason: z.string().nullable(),
  failed: z.boolean(),
  infrastructure_fail: z.boolean(),
  is_first_green_build: z.boolean(),
  job_name: z.string().nullable(),
  lifecycle: z.string(),
  messages: z.array(
    z.object({
      message: z.string(),
      reason: z.string(),
      type: z.string(),
    }),
  ),
  node: z.string().nullable(),
  oss: z.boolean(),
  outcome: z.string(),
  owners: z.array(z.string()),
  parallel: z.number(),
  picard: z.object({
    executor: z.string(),
    resource_class: z.object({
      class: z.string(),
      name: z.string(),
      cpu: z.number(),
      ram: z.number(),
    }),
  }),
  platform: z.string(),
  previous: z
    .object({
      build_num: z.number(),
      build_time_millis: z.number(),
      status: z.string(),
    })
    .nullable(),
  previous_successful_build: z.object({
    build_num: z.number(),
    build_time_millis: z.number(),
    status: z.string(),
  }),
  pull_requests: z.array(z.unknown()),
  queued_at: z.string(),
  reponame: z.string(),
  retries: z.string().nullable(),
  retry_of: z.string().nullable(),
  ssh_disabled: z.boolean(),
  ssh_users: z.array(z.string()),
  start_time: z.string(),
  status: z.string(),
  steps: z.array(
    z.object({
      name: z.string(),
      actions: z.array(
        z.object({
          index: z.number(),
          step: z.number(),
          allocation_id: z.string(),
          name: z.string(),
          type: z.string(),
          start_time: z.string(),
          truncated: z.boolean(),
          parallel: z.boolean().optional(),
          bash_command: z.string().nullable(),
          background: z.boolean(),
          insignificant: z.boolean(),
          has_output: z.boolean(),
          continue: z.string().nullable(),
          end_time: z.string(),
          exit_code: z.number().nullable(),
          run_time_millis: z.number(),
          output_url: z.string(),
          status: z.string(),
          failed: z.boolean().nullable(),
          infrastructure_fail: z.boolean().nullable(),
          timedout: z.boolean().nullable(),
          canceled: z.boolean().nullable(),
        }),
      ),
    }),
  ),
  stop_time: z.string(),
  subject: z.string(),
  timedout: z.boolean(),
  usage_queued_at: z.string(),
  user: z.object({
    avatar_url: z.string(),
    id: z.union([z.string(), z.number()]),
    is_user: z.boolean(),
    login: z.string(),
    name: z.string(),
    vcs_type: z.string(),
  }),
  username: z.string(),
  vcs_revision: z.string(),
  vcs_tag: z.string().nullable(),
  vcs_type: z.string(),
  vcs_url: z.string(),
  why: z.string(),
  workflows: z.object({
    job_id: z.string(),
    job_name: z.string(),
    upstream_concurrency_map: z.record(z.unknown()),
    upstream_job_ids: z.array(z.string()),
    workflow_id: z.string(),
    workflow_name: z.string(),
    workspace_id: z.string(),
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
