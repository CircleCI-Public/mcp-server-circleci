import { FlakyTest, JobMetrics, WorkflowMetrics } from '../schemas.js';
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

  /**
   * Get workflow metrics for a project
   * @param params Configuration parameters
   * @param params.projectSlug The project slug
   * @param params.workflowName Optional workflow name to filter by
   * @param params.branch Optional branch name to filter by
   * @param params.timeWindow Time window for analysis (7d, 30d, 90d)
   * @returns Workflow metrics
   */
  async getWorkflowMetrics({
    projectSlug,
    workflowName,
    branch,
    timeWindow = '30d',
  }: {
    projectSlug?: string;
    workflowName?: string;
    branch?: string;
    timeWindow?: '7d' | '30d' | '90d';
  }): Promise<WorkflowMetrics> {
    const queryParams = new URLSearchParams();
    if (workflowName) queryParams.append('workflow-name', workflowName);
    if (branch) queryParams.append('branch', branch);
    queryParams.append('time-window', timeWindow);

    const rawResult = await this.client.get<unknown>(
      `/insights/${projectSlug}/workflows?${queryParams.toString()}`,
    );

    console.error('rawResult', rawResult);

    const parsedResult = WorkflowMetrics.safeParse(rawResult);

    if (!parsedResult.success) {
      throw new Error('Failed to parse workflow metrics response');
    }

    return parsedResult.data;
  }

  /**
   * Get job metrics for a workflow
   * @param params Configuration parameters
   * @param params.projectSlug The project slug
   * @param params.workflowName Optional workflow name to filter by
   * @param params.branch Optional branch name to filter by
   * @param params.timeWindow Time window for analysis (7d, 30d, 90d)
   * @returns Array of job metrics
   */
  async getJobMetrics({
    projectSlug,
    workflowName,
    branch,
    timeWindow = '30d',
  }: {
    projectSlug: string;
    workflowName?: string;
    branch?: string;
    timeWindow?: '7d' | '30d' | '90d';
  }): Promise<JobMetrics[]> {
    const queryParams = new URLSearchParams();
    if (workflowName) queryParams.append('workflow-name', workflowName);
    if (branch) queryParams.append('branch', branch);
    queryParams.append('time-window', timeWindow);

    const rawResult = await this.client.get<unknown>(
      `/insights/${projectSlug}/jobs/metrics?${queryParams.toString()}`,
    );

    if (!Array.isArray(rawResult)) {
      throw new Error('Expected array of job metrics');
    }

    const parsedResults = rawResult.map((item) => {
      const parsedResult = JobMetrics.safeParse(item);
      if (!parsedResult.success) {
        throw new Error('Failed to parse job metrics response');
      }
      return parsedResult.data;
    });

    return parsedResults;
  }
}
