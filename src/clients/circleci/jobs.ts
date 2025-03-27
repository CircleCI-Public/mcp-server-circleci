import { JobDetails } from '../types.js';
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
   * @param projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param jobNumber The number of the job
   * @returns Job details
   */
  async getJobByNumber(
    projectSlug: string,
    jobNumber: number,
  ): Promise<JobDetails> {
    const result = await this.client.get<JobDetails>(
      `/project/${projectSlug}/job/${jobNumber}`,
    );
    return result;
  }
}
