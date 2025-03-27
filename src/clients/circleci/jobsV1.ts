import { JobDetails } from '../types.js';
import { HTTPClient } from './httpClient.js';

export class JobsV1API {
  protected client: HTTPClient;

  constructor(token: string) {
    this.client = new HTTPClient('https://circleci.com/api/v1.1', {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  async getJobDetails({
    projectSlug,
    jobNumber,
  }: {
    projectSlug: string;
    jobNumber: number;
  }): Promise<JobDetails> {
    const result = await this.client.get<JobDetails>(
      `/project/${projectSlug}/${jobNumber}`,
    );
    return result;
  }
}
