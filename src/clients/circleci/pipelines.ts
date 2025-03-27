import { Pipeline } from '../types.js';
import { HTTPClient } from './httpClient.js';

type PipelineResponse = {
  items: Pipeline[];
  next_page_token: string;
};

export class PipelinesAPI {
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
   * @returns Pipelines
   */
  async getRecentPipelines(projectSlug: string): Promise<Pipeline[]> {
    const result = await this.client.get<PipelineResponse>(
      `/project/${projectSlug}/pipeline`,
    );
    return result.items;
  }
}
