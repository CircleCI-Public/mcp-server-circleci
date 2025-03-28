import { Pipeline } from '../types.js';
import { HTTPClient } from './httpClient.js';
import { createCircleCIHeaders, defaultPaginationOptions } from './index.js';

type PipelineResponse = {
  items: Pipeline[];
  next_page_token: string;
};

export class PipelinesAPI {
  protected client: HTTPClient;

  constructor(token: string) {
    this.client = new HTTPClient(
      'https://circleci.com/api/v2',
      createCircleCIHeaders({ token }),
    );
  }

  /**
   * Get most recent page of pipelines
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.branch Optional branch name to filter pipelines
   * @returns Pipelines
   */
  async getRecentPipelines({
    projectSlug,
    branch,
  }: {
    projectSlug: string;
    branch?: string;
  }): Promise<Pipeline[]> {
    const result = await this.client.get<PipelineResponse>(
      `/project/${projectSlug}/pipeline`,
      branch ? { branch } : undefined,
    );
    return result.items;
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
   * @returns Filtered pipelines until the stop condition is met
   * @throws Error if timeout or max pages reached
   */
  async getFilteredPipelines({
    projectSlug,
    filterFn,
    branch,
    options = {},
  }: {
    projectSlug: string;
    filterFn: (pipeline: Pipeline) => boolean;
    branch?: string;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
    };
  }): Promise<Pipeline[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
    } = options;

    const startTime = Date.now();
    const filteredPipelines: Pipeline[] = [];
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

      const params: { 'page-token'?: string; branch?: string } = {
        ...(nextPageToken ? { 'page-token': nextPageToken } : {}),
        ...(branch ? { branch } : {}),
      };
      const result: PipelineResponse = await this.client.get<PipelineResponse>(
        `/project/${projectSlug}/pipeline`,
        { params },
      );

      pageCount++;

      // Using for...of instead of forEach to allow breaking the loop
      // when we find a non-matching pipeline. forEach doesn't support break.
      for (const pipeline of result.items) {
        if (filterFn(pipeline)) {
          filteredPipelines.push(pipeline);
        } else {
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

  /**
   * Get a pipeline by commit hash
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.branch Branch name
   * @param params.commit Commit hash to find
   * @returns Pipeline matching the commit
   */
  async getPipelineByCommit({
    projectSlug,
    branch,
    commit,
  }: {
    projectSlug: string;
    branch: string;
    commit: string;
  }): Promise<Pipeline> {
    const pipelines = await this.getFilteredPipelines({
      projectSlug,
      filterFn: (pipeline) => pipeline.vcs?.revision === commit,
      branch,
    });

    return pipelines[0];
  }
}
