import { JobsAPI } from './jobs.js';
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

  constructor(token: string) {
    this.jobs = new JobsAPI(token);
    this.pipelines = new PipelinesAPI(token);
    this.workflows = new WorkflowsAPI(token);
  }
}
