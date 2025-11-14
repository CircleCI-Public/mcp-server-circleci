import { Workflow, RerunWorkflow } from '../schemas.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';
import { z } from 'zod';

const WorkflowResponseSchema = z.object({
  items: z.array(Workflow),
  next_page_token: z.string().nullable(),
});

export class WorkflowsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
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
    let nextPageToken: string | null = null;
    let pageCount = 0;

    do {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout reached after ${timeoutMs}ms`);
      }

      // Check page limit
      if (pageCount >= maxPages) {
        throw new Error(`Maximum number of pages (${maxPages}) reached`);
      }

      const params = nextPageToken ? { 'page-token': nextPageToken } : {};
      const rawResult = await this.client.get<unknown>(
        `/pipeline/${pipelineId}/workflow`,
        params,
      );

      // Validate the response against our WorkflowResponse schema
      const result = WorkflowResponseSchema.parse(rawResult);

      pageCount++;
      allWorkflows.push(...result.items);
      nextPageToken = result.next_page_token;
    } while (nextPageToken);

    return allWorkflows;
  }

  /**
   * Get a workflow
   * @param workflowId The workflowId
   * @returns Information about the workflow
   * @throws Error if the request fails
   */
  async getWorkflow({ workflowId }: { workflowId: string }): Promise<Workflow> {
    const rawResult = await this.client.get<unknown>(`/workflow/${workflowId}`);

    const parsedResult = Workflow.safeParse(rawResult);
    if (!parsedResult.success) {
      console.error('Parse error:', parsedResult.error);
      throw new Error('Failed to parse workflow response');
    }
    return parsedResult.data;
  }

  /**
   * Rerun workflow from failed job or start
   * @param workflowId The workflowId
   * @param fromFailed Whether to rerun from failed job or start
   * @param enableSsh Enable SSH access for debugging the rerun jobs
   * @param jobs Array of job IDs to rerun
   * @returns A new workflowId
   * @throws Error if the request fails
   */
  async rerunWorkflow({
    workflowId,
    fromFailed,
    enableSsh,
    jobs,
  }: {
    workflowId: string;
    fromFailed?: boolean;
    enableSsh?: boolean;
    jobs?: string[];
  }): Promise<RerunWorkflow> {
    const rawResult = await this.client.post<unknown>(
      `/workflow/${workflowId}/rerun`,
      {
        from_failed: fromFailed,
        enable_ssh: enableSsh,
        jobs,
      },
    );
    const parsedResult = RerunWorkflow.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse workflow response');
    }

    return parsedResult.data;
  }
}
