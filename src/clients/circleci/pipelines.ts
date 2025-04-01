import { Pipeline } from '../schemas.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';
import { z } from 'zod';

const PaginatedPipelineResponseSchema = z.object({
  items: z.array(Pipeline),
  next_page_token: z.string(),
});

export class PipelinesAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Get recent pipelines until a condition is met
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.filterFn Function to filter pipelines and determine when to stop fetching
   * @param params.branch Optional branch name to filter pipelines
   * @param params.options Optional configuration for pagination limits
   * @param params.options.maxPages Maximum number of pages to fetch (default: 5)
   * @param params.options.timeoutMs Timeout in milliseconds (default: 10000)
   * @param params.options.findFirst Whether to find the first pipeline that matches the filterFn (default: false)
   * @returns Filtered pipelines until the stop condition is met
   * @throws Error if timeout or max pages reached
   */
  async getPipelinesByBranch({
    projectSlug,
    branch,
    options = {},
  }: {
    projectSlug: string;
    branch: string;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
      findFirst?: boolean;
    };
  }): Promise<Pipeline[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
      findFirst = defaultPaginationOptions.findFirst,
    } = options;

    const startTime = Date.now();
    const filteredPipelines: Pipeline[] = [];
    let nextPageToken: string | undefined = '';
    let pageCount = 0;

    while (nextPageToken !== undefined) {
      if (Date.now() - startTime > timeoutMs) {
        nextPageToken = undefined;
        break;
      }

      if (pageCount >= maxPages) {
        nextPageToken = undefined;
        break;
      }

      const params = {
        ...(branch ? { branch } : {}),
        ...(nextPageToken ? { 'page-token': nextPageToken } : {}),
      };

      const rawResult = await this.client.get<unknown>(
        `/project/${projectSlug}/pipeline`,
        params,
      );

      const result = PaginatedPipelineResponseSchema.parse(rawResult);

      pageCount++;

      // Using for...of instead of forEach to allow breaking the loop
      for (const pipeline of result.items) {
        filteredPipelines.push(pipeline);
        if (findFirst) {
          nextPageToken = undefined;
          break;
        }
      }

      if (nextPageToken !== undefined) {
        nextPageToken = result.next_page_token || undefined;
      }
    }

    return filteredPipelines;
  }

  async getPipelineByNumber({
    projectSlug,
    pipelineNumber,
  }: {
    projectSlug: string;
    pipelineNumber: number;
  }): Promise<Pipeline | undefined> {
    const rawResult = await this.client.get<unknown>(
      `/project/${projectSlug}/pipeline/${pipelineNumber}`,
    );

    return Pipeline.parse(rawResult);
  }
}
