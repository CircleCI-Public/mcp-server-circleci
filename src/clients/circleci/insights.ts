import { FlakyTest } from '../schemas.js';
import { HTTPClient } from './httpClient.js';

export class InsightsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Get all workflows for a pipeline with pagination support
   * @param params Configuration parameters
   * @param params.projectSlug The project slug
   * @returns Flaky test details
   * @throws Error if timeout or max pages reached
   */
  async getProjectFlakyTests({
    projectSlug,
  }: {
    projectSlug: string;
  }): Promise<FlakyTest> {
    const rawResult = await this.client.get<unknown>(
      `/insights/${projectSlug}/flaky-tests`,
    );

    const parsedResult = FlakyTest.safeParse(rawResult);

    if (!parsedResult.success) {
      throw new Error('Failed to parse flaky test response');
    }

    return parsedResult.data;
  }
}
