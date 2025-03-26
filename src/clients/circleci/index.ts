import { JobsAPI } from './jobs.js';

export class CircleCIClients {
  public jobs: JobsAPI;

  constructor(token: string) {
    this.jobs = new JobsAPI(token);
  }
}
