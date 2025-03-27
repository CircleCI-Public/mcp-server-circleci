import { Pipeline } from '../types.js';
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
  async getRecentPipelines(projectSlug: string): Promise<Pipeline[]> {
    const result = await this.client.get<Pipeline[]>(
      `/project/${projectSlug}/pipeline`,
    );
    return result;
  }
}
