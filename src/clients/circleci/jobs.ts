import { Job } from '../schemas.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';
import { z } from 'zod';

const WorkflowJobResponseSchema = z.object({
  items: z.array(Job),
  next_page_token: z.string().nullable(),
});

export class JobsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
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
    const rawResult = await this.client.get<unknown>(
      `/project/${projectSlug}/job/${jobNumber}`,
    );
    // Validate the response against our Job schema
    return Job.parse(rawResult);
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
        `/workflow/${workflowId}/job`,
        params,
      );

      // Validate the response against our WorkflowJobResponse schema
      const result = WorkflowJobResponseSchema.parse(rawResult);

      pageCount++;
      allJobs.push(...result.items);
      nextPageToken = result.next_page_token;
    } while (nextPageToken);

    return allJobs;
  }
}
