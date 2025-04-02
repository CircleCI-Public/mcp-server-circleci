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
    type: z.enum(['webhook', 'explicit', 'api', 'schedule']),
    received_at: z.string(),
    actor: z.object({
      login: z.string(),
      avatar_url: z.string(),
    }),
  }),
  trigger_parameters: z
    .object({
      circleci: z
        .object({
          event_action: z.string(),
          event_time: z.string(),
          provider_actor_id: z.string(),
          provider_name: z.string(),
          provider_login: z.string(),
          actor_id: z.string(),
          event_type: z.string(),
          trigger_type: z.string(),
        })
        .optional(),
      github_app: z
        .object({
          web_url: z.string(),
          commit_author_name: z.string(),
          owner: z.string(),
          user_id: z.string(),
          full_ref: z.string(),
          user_name: z.string(),
          pull_request_merged: z.string(),
          forced: z.string(),
          user_username: z.string(),
          branch: z.string(),
          content_ref: z.string(),
          repo_id: z.string(),
          commit_title: z.string(),
          commit_message: z.string(),
          total_commits_count: z.string(),
          repo_url: z.string(),
          user_avatar: z.string(),
          pull_request_draft: z.string(),
          ref: z.string(),
          repo_name: z.string(),
          commit_author_email: z.string(),
          checkout_sha: z.string(),
          commit_timestamp: z.string(),
          default_branch: z.string(),
          repo_full_name: z.string(),
          commit_sha: z.string(),
        })
        .optional(),
      git: z
        .object({
          commit_author_name: z.string(),
          repo_owner: z.string(),
          branch: z.string(),
          commit_message: z.string(),
          repo_url: z.string(),
          ref: z.string(),
          author_avatar_url: z.string(),
          checkout_url: z.string(),
          author_login: z.string(),
          repo_name: z.string(),
          commit_author_email: z.string(),
          checkout_sha: z.string(),
          default_branch: z.string(),
        })
        .optional(),
      webhook: z
        .object({
          body: z.string(),
        })
        .optional(),
    })
    .optional(),
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
  web_url: z.string(),
  project: z.object({
    slug: z.string(),
    name: z.string(),
    external_url: z.string(),
  }),
  parallel_runs: z.array(
    z.object({
      index: z.number(),
      status: z.string(),
    }),
  ),
  started_at: z.string(),
  latest_workflow: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  name: z.string(),
  executor: z.object({
    type: z.string(),
    resource_class: z.string(),
  }),
  parallelism: z.number(),
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
  number: z.number(),
  pipeline: z.object({
    id: z.string(),
  }),
  duration: z.number(),
  created_at: z.string(),
  messages: z.array(z.string()),
  contexts: z.array(z.string()),
  organization: z.object({
    name: z.string(),
  }),
  queued_at: z.string(),
  stopped_at: z.string(),
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
  messages: z.array(z.string()),
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
  previous: z.object({
    build_num: z.number(),
    build_time_millis: z.number(),
    status: z.string(),
  }),
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
          parallel: z.boolean(),
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
    id: z.string(),
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

export const Workflow = WorkflowSchema;
export type Workflow = z.infer<typeof WorkflowSchema>;

export const Job = JobSchema;
export type Job = z.infer<typeof JobSchema>;

export const JobDetails = JobDetailsSchema;
export type JobDetails = z.infer<typeof JobDetailsSchema>;

export const FollowedProject = FollowedProjectSchema;
export type FollowedProject = z.infer<typeof FollowedProjectSchema>;
