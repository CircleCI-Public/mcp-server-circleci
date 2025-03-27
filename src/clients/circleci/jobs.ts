import { Job } from '../types.js';
import { HTTPClient } from './httpClient.js';

export class JobsAPI {
  protected client: HTTPClient;

  constructor(token: string) {
    this.client = new HTTPClient('https://circleci.com/api/v2', {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Get job details by job number
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.jobNumber The number of the job
   * @returns Job details
   */
  async getJobByNumber({
    projectSlug,
    jobNumber,
  }: {
    projectSlug: string;
    jobNumber: number;
  }): Promise<Job> {
    const result = await this.client.get<Job>(
      `/project/${projectSlug}/job/${jobNumber}`,
    );
    return result;
  }
}
