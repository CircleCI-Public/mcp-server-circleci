import { FlakyTest, JobMetrics, WorkflowMetrics } from '../schemas.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';
import { z } from 'zod';

const WorkflowMetricsResponseSchema = z.object({
  items: z.array(WorkflowMetrics),
  next_page_token: z.string().nullable(),
});

const JobMetricsResponseSchema = z.object({
  items: z.array(JobMetrics),
  next_page_token: z.string().nullable(),
});

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

  /**
   * Get workflow metrics for a project
   * @param params Configuration parameters
   * @param params.projectSlug The project slug
   * @param params.options Optional configuration parameters
   * @returns Array of workflow metrics
   * @throws Error if timeout or max pages reached
   * @throws Error if failed to parse project workflow metrics response
   */
  async getProjectWorkflowsMetrics({
    projectSlug,
    options = {},
  }: {
    projectSlug: string;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
      reportingWindow?:
        | 'last-24-hours'
        | 'last-7-days'
        | 'last-30-days'
        | 'last-60-days'
        | 'last-90-days';
      allBranches?: boolean;
      branch?: string;
    };
  }): Promise<WorkflowMetrics[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
    } = options;

    const startTime = Date.now();
    const allWorkflowsMetrics: WorkflowMetrics[] = [];
    let nextPageToken: string | null = null;
    let pageCount = 0;

    const params: Record<string, string | boolean> = {};

    // Add optional reporting window param, defaulting to last-90-days
    params['reporting-window'] = options.reportingWindow || 'last-30-days';

    // Add branch filtering params - either all-branches or specific branch
    if (options.allBranches) {
      params['all-branches'] = true;
    } else if (options.branch) {
      params.branch = options.branch;
    }

    // Initialize pagination tracking
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
        `/insights/${projectSlug}/workflows/metrics`,
        params,
      );

      // Validate the response against our WorkflowMetricsResponse schema
      const result = WorkflowMetricsResponseSchema.safeParse(rawResult);

      if (!result.success) {
        throw new Error('Failed to parse project workflow metrics response');
      }

      pageCount++;
      allWorkflowsMetrics.push(...result.data.items);
      nextPageToken = result.data.next_page_token;
    } while (nextPageToken);

    return allWorkflowsMetrics;
  }

  /**
   * Get summary metrics for a project workflow's jobs
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.workflowName The name of the workflow
   * @param params.options Optional configuration for pagination and filtering
   * @param params.options.maxPages Maximum number of pages to fetch (default: 5)
   * @param params.options.timeoutMs Timeout in milliseconds (default: 10000)
   * @param params.options.allBranches Whether to retrieve data for all branches combined
   * @param params.options.branch The name of a specific branch to analyze
   * @param params.options.reportingWindow Time window for analysis (default: last-90-days)
   * @param params.options.jobName Optional job name to filter results
   * @returns Array of job metrics
   */
  async getJobMetrics({
    projectSlug,
    workflowName,
    options = {},
  }: {
    projectSlug: string;
    workflowName: string;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
      allBranches?: boolean;
      branch?: string;
      reportingWindow?:
        | 'last-7-days'
        | 'last-24-hours'
        | 'last-30-days'
        | 'last-60-days'
        | 'last-90-days';
      jobName?: string;
    };
  }): Promise<JobMetrics[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
    } = options;

    const startTime = Date.now();
    const allJobMetrics: JobMetrics[] = [];
    let nextPageToken: string | null = null;
    let pageCount = 0;

    const params: Record<string, string | boolean> = {};

    // Add required workflow name
    params['workflow-name'] = workflowName;

    // Add optional reporting window param, defaulting to last-90-days
    params['reporting-window'] = options.reportingWindow || 'last-90-days';

    // Add branch filtering params - either all-branches or specific branch
    if (options.allBranches) {
      params['all-branches'] = true;
    } else if (options.branch) {
      params.branch = options.branch;
    }

    // Add optional job name filter
    if (options.jobName) {
      params['job-name'] = options.jobName;
    }

    do {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout reached after ${timeoutMs}ms`);
      }

      // Check page limit
      if (pageCount >= maxPages) {
        throw new Error(`Maximum number of pages (${maxPages}) reached`);
      }

      if (nextPageToken) {
        params['page-token'] = nextPageToken;
      }

      const rawResult = await this.client.get<unknown>(
        `/insights/${projectSlug}/workflows/${workflowName}/jobs`,
        params,
      );

      // Validate the response against our schema
      const result = JobMetricsResponseSchema.safeParse(rawResult);

      if (!result.success) {
        throw new Error('Failed to parse job metrics response');
      }

      pageCount++;
      allJobMetrics.push(...result.data.items);
      nextPageToken = result.data.next_page_token;
    } while (nextPageToken);

    return allJobMetrics;
  }
}
