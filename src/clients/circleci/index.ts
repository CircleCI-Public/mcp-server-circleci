import { JobsAPI } from './jobs.js';
import { PipelinesAPI } from './pipelines.js';
export class CircleCIClients {
  public jobs: JobsAPI;
  public pipelines: PipelinesAPI;

  constructor(token: string) {
    this.jobs = new JobsAPI(token);
    this.pipelines = new PipelinesAPI(token);
  }
}
