// TODO: fix types for pipelines
export type Pipeline = {
  id: string;
  projectSlug: string;
  projectV2?: ProjectV2;
  state: string;
  createdAt: string;
  number: string;
  workflows: PipelineWorkflow[];
  branch: string | undefined;
  tag: string | undefined;
  commit: PipelineCommit | undefined;
  vcsRevision: string | undefined;
  actor: PipelineActor;
  vcsUrl: string | undefined;
  messages: PipelineMessage[];
  triggerType: Trigger;
  policyDecision?: PolicyDecision;
  triggerParameters: TriggerParameters;
  pipelineValues?: PipelineValues;
};

export type JobDetails = {
  web_url: string;
  project: {
    slug: string;
    name: string;
    external_url: string;
  };
  parallel_runs: number[];
  started_at: string;
  latest_workflow: {
    id: string;
    name: string;
  };
  name: string;
  executor: {
    type: string;
    resource_class: string;
  };
  parallelism: number;
  status: string;
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
