import { Job, JobDetails } from '../types.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';

type WorkflowJobResponse = {
  items: Job[];
  next_page_token: string;
};

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
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.jobNumber The number of the job
   * @returns Job details
   */
  async getJobByNumber({
    projectSlug,
    jobNumber,
  }: {
    projectSlug: string;
    jobNumber: number;
  }): Promise<Job> {
    const result = await this.client.get<Job>(
      `/project/${projectSlug}/job/${jobNumber}`,
    );
    return result;
  }

  /**
   * Get jobs for a workflow with pagination support
   * @param params Configuration parameters
   * @param params.workflowId The ID of the workflow
   * @param params.options Optional configuration for pagination limits
   * @param params.options.maxPages Maximum number of pages to fetch (default: 5)
   * @param params.options.timeoutMs Timeout in milliseconds (default: 10000)
   * @returns All jobs for the workflow
   * @throws Error if timeout or max pages reached
   */
  async getWorkflowJobs({
    workflowId,
    options = {},
  }: {
    workflowId: string;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
    };
  }): Promise<Job[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
    } = options;

    const startTime = Date.now();
    const allJobs: Job[] = [];
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
      const result: WorkflowJobResponse =
        await this.client.get<WorkflowJobResponse>(
          `/workflow/${workflowId}/job`,
          { params },
        );

      pageCount++;
      allJobs.push(...result.items);
      nextPageToken = result.next_page_token || undefined;
    }

    return allJobs;
  }
}
