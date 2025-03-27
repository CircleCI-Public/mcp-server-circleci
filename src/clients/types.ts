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
