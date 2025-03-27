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
