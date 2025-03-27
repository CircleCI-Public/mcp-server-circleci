import { JobsAPI } from './jobs.js';
import { JobsV1API } from './jobsV1.js';
import { PipelinesAPI } from './pipelines.js';
import { WorkflowsAPI } from './workflows.js';

export const defaultPaginationOptions = {
  maxPages: 5,
  timeoutMs: 10000,
} as const;

export class CircleCIClients {
  public jobs: JobsAPI;
  public pipelines: PipelinesAPI;
  public workflows: WorkflowsAPI;
  public jobsV1: JobsV1API;

  constructor(token: string) {
    this.jobs = new JobsAPI(token);
    this.pipelines = new PipelinesAPI(token);
    this.workflows = new WorkflowsAPI(token);
    this.jobsV1 = new JobsV1API(token);
  }
}
