import { Workflow } from '../types.js';
import { HTTPClient } from './httpClient.js';
import { createCircleCIHeaders, defaultPaginationOptions } from './index.js';

type WorkflowResponse = {
  items: Workflow[];
  next_page_token: string;
};

export class WorkflowsAPI {
  protected client: HTTPClient;

  constructor(token: string) {
    this.client = new HTTPClient(
      'https://circleci.com/api/v2',
      createCircleCIHeaders({ token }),
    );
  }

  /**
   * Get all workflows for a pipeline with pagination support
   * @param params Configuration parameters
   * @param params.pipelineId The pipeline ID
   * @param params.options Optional configuration for pagination limits
   * @param params.options.maxPages Maximum number of pages to fetch (default: 5)
   * @param params.options.timeoutMs Timeout in milliseconds (default: 10000)
   * @returns All workflows from the pipeline
   * @throws Error if timeout or max pages reached
   */
  async getPipelineWorkflows({
    pipelineId,
    options = {},
  }: {
    pipelineId: string;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
    };
  }): Promise<Workflow[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
    } = options;

    const startTime = Date.now();
    const allWorkflows: Workflow[] = [];
    let nextPageToken: string | undefined = '';
    let pageCount = 0;

    while (nextPageToken !== undefined) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout reached after ${timeoutMs}ms`);
      }

      // Check page limit
      if (pageCount >= maxPages) {
        throw new Error(`Maximum number of pages (${maxPages}) reached`);
      }

      const params = nextPageToken ? { 'page-token': nextPageToken } : {};
      const result: WorkflowResponse = await this.client.get<WorkflowResponse>(
        `/pipeline/${pipelineId}/workflow`,
        params,
      );

      pageCount++;
      allWorkflows.push(...result.items);
      nextPageToken = result.next_page_token || undefined;
    }

    return allWorkflows;
  }
}
