import {
  PaginatedPipelineResponseSchema,
  Pipeline,
  PipelineDefinitionsResponse,
  RunPipelineResponse,
  PipelineDefinition,
} from '../schemas.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';

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
  async getPipelines({
    projectSlug,
    branch,
    options = {},
  }: {
    projectSlug: string;
    branch?: string;
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
    let nextPageToken: string | null = null;
    let pageCount = 0;

    do {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        nextPageToken = null;
        break;
      }

      // Check page limit
      if (pageCount >= maxPages) {
        nextPageToken = null;
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

      const result = PaginatedPipelineResponseSchema.safeParse(rawResult);

      if (!result.success) {
        throw new Error('Failed to parse pipeline response');
      }

      pageCount++;

      // Using for...of instead of forEach to allow breaking the loop
      for (const pipeline of result.data.items) {
        filteredPipelines.push(pipeline);
        if (findFirst) {
          nextPageToken = null;
          break;
        }
      }

      nextPageToken = result.data.next_page_token;
    } while (nextPageToken);

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

    const parsedResult = Pipeline.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse pipeline response');
    }

    return parsedResult.data;
  }

  async getPipelineDefinitions({
    projectId,
  }: {
    projectId: string;
  }): Promise<PipelineDefinition[]> {
    const rawResult = await this.client.get<unknown>(
      `/projects/${projectId}/pipeline-definitions`,
    );

    const parsedResult = PipelineDefinitionsResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse pipeline definition response');
    }

    return parsedResult.data.items;
  }

  async runPipeline({
    projectSlug,
    branch,
    definitionId,
  }: {
    projectSlug: string;
    branch: string;
    definitionId: string;
  }): Promise<RunPipelineResponse> {
    const rawResult = await this.client.post<unknown>(
      `/project/${projectSlug}/pipeline/run`,
      {
        definition_id: definitionId,
        config: {
          branch,
        },
        checkout: {
          branch,
        },
      },
    );

    const parsedResult = RunPipelineResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse pipeline response');
    }

    return parsedResult.data;
  }
}
