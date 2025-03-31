import { JobDetails } from '../types.js';
import { HTTPClient } from './httpClient.js';

export class JobsV1API {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }
  /**
   * Get detailed information about a specific job
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.jobNumber The number of the job
   * @returns Detailed job information including status, timing, and build details
   */
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
