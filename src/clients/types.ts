export type Pipeline = {
  id: string;
  errors: Array<{
    type: string;
    message: string;
  }>;
  project_slug: string;
  updated_at: string;
  number: number;
  state: 'created' | 'errored' | 'setup-pending' | 'setup' | 'pending';
  created_at: string;
  trigger: {
    type: 'webhook' | 'explicit' | 'api' | 'schedule';
    received_at: string;
    actor: {
      login: string;
      avatar_url: string;
    };
  };
  trigger_parameters?: {
    circleci?: {
      event_action: string;
      event_time: string;
      provider_actor_id: string;
      provider_name: string;
      provider_login: string;
      actor_id: string;
      event_type: string;
      trigger_type: string;
    };
    github_app?: {
      web_url: string;
      commit_author_name: string;
      owner: string;
      user_id: string;
      full_ref: string;
      user_name: string;
      pull_request_merged: string;
      forced: string;
      user_username: string;
      branch: string;
      content_ref: string;
      repo_id: string;
      commit_title: string;
      commit_message: string;
      total_commits_count: string;
      repo_url: string;
      user_avatar: string;
      pull_request_draft: string;
      ref: string;
      repo_name: string;
      commit_author_email: string;
      checkout_sha: string;
      commit_timestamp: string;
      default_branch: string;
      repo_full_name: string;
      commit_sha: string;
    };
    git?: {
      commit_author_name: string;
      repo_owner: string;
      branch: string;
      commit_message: string;
      repo_url: string;
      ref: string;
      author_avatar_url: string;
      checkout_url: string;
      author_login: string;
      repo_name: string;
      commit_author_email: string;
      checkout_sha: string;
      default_branch: string;
    };
    webhook?: {
      body: string;
    };
  };
  vcs?: {
    provider_name: string;
    target_repository_url: string;
    branch?: string;
    review_id?: string;
    review_url?: string;
    revision: string;
    tag?: string;
    commit?: {
      subject: string;
      body: string;
    };
  };
};

export type Workflow = {
  pipeline_id: string;
  id: string;
  name: string;
  project_slug: string;
  status:
    | 'success'
    | 'running'
    | 'not_run'
    | 'failed'
    | 'error'
    | 'failing'
    | 'on_hold'
    | 'canceled'
    | 'unauthorized';
  started_by: string;
  pipeline_number: number;
  created_at: string;
  stopped_at: string;
};

export type Job = {
  web_url: string;
  project: {
    slug: string;
    name: string;
    external_url: string;
  };
  parallel_runs: Array<{
    index: number;
    status: string;
  }>;
  started_at: string;
  latest_workflow?: {
    id: string;
    name: string;
  };
  name: string;
  executor: {
    type: string;
    resource_class: string;
  };
  parallelism: number;
  status:
    | 'success'
    | 'running'
    | 'not_run'
    | 'failed'
    | 'error'
    | 'failing'
    | 'on_hold'
    | 'canceled'
    | 'unauthorized';
  number: number;
  pipeline: {
    id: string;
  };
  duration: number;
  created_at: string;
  messages: string[];
  contexts: string[];
  organization: {
    name: string;
  };
  queued_at: string;
  stopped_at: string;
};

export type JobDetails = {
  all_commit_details: Array<{
    author_date: string | null;
    author_email: string;
    author_login: string;
    author_name: string;
    body: string;
    branch: string;
    commit: string;
    commit_url: string;
    committer_date: string | null;
    committer_email: string | null;
    committer_login: string | null;
    committer_name: string | null;
    subject: string;
  }>;
  all_commit_details_truncated: boolean;
  author_date: string | null;
  author_email: string;
  author_name: string;
  body: string;
  branch: string;
  build_num: number;
  build_parameters: Record<string, unknown>;
  build_time_millis: number;
  build_url: string;
  canceled: boolean;
  canceler: string | null;
  circle_yml: {
    string: string;
  };
  committer_date: string | null;
  committer_email: string | null;
  committer_name: string | null;
  compare: string | null;
  context_ids: string[];
  dont_build: string | null;
  fail_reason: string | null;
  failed: boolean;
  infrastructure_fail: boolean;
  is_first_green_build: boolean;
  job_name: string | null;
  lifecycle: string;
  messages: string[];
  node: string | null;
  oss: boolean;
  outcome: string;
  owners: string[];
  parallel: number;
  picard: {
    executor: string;
    resource_class: {
      class: string;
      name: string;
      cpu: number;
      ram: number;
    };
  };
  platform: string;
  previous: {
    build_num: number;
    build_time_millis: number;
    status: string;
  };
  previous_successful_build: {
    build_num: number;
    build_time_millis: number;
    status: string;
  };
  pull_requests: unknown[];
  queued_at: string;
  reponame: string;
  retries: string | null;
  retry_of: string | null;
  ssh_disabled: boolean;
  ssh_users: string[];
  start_time: string;
  status: string;
  steps: Array<{
    name: string;
    actions: Array<{
      index: number;
      step: number;
      allocation_id: string;
      name: string;
      type: string;
      start_time: string;
      truncated: boolean;
      parallel: boolean;
      bash_command: string | null;
      background: boolean;
      insignificant: boolean;
      has_output: boolean;
      continue: string | null;
      end_time: string;
      exit_code: number | null;
      run_time_millis: number;
      output_url: string;
      status: string;
      failed: boolean | null;
      infrastructure_fail: boolean | null;
      timedout: boolean | null;
      canceled: boolean | null;
    }>;
  }>;
  stop_time: string;
  subject: string;
  timedout: boolean;
  usage_queued_at: string;
  user: {
    avatar_url: string;
    id: string;
    is_user: boolean;
    login: string;
    name: string;
    vcs_type: string;
  };
  username: string;
  vcs_revision: string;
  vcs_tag: string | null;
  vcs_type: string;
  vcs_url: string;
  why: string;
  workflows: {
    job_id: string;
    job_name: string;
    upstream_concurrency_map: Record<string, unknown>;
    upstream_job_ids: string[];
    workflow_id: string;
    workflow_name: string;
    workspace_id: string;
  };
};
