import { Test } from '../schemas.js';
import { HTTPClient } from './httpClient.js';
import { defaultPaginationOptions } from './index.js';
import { z } from 'zod';

const TestResponseSchema = z.object({
  items: z.array(Test),
  next_page_token: z.string().nullable(),
});

export class TestsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Get all tests for a job with pagination support
   * @param params Configuration parameters
   * @param params.projectSlug The project slug
   * @param params.jobNumber The job number
   * @param params.options Optional configuration for pagination limits
   * @param params.options.maxPages Maximum number of pages to fetch (default: 5)
   * @param params.options.timeoutMs Timeout in milliseconds (default: 10000)
   * @returns All tests from the job
   * @throws Error if timeout or max pages reached
   */
  async getJobTests({
    projectSlug,
    jobNumber,
    options = {},
  }: {
    projectSlug: string;
    jobNumber: number;
    options?: {
      maxPages?: number;
      timeoutMs?: number;
    };
  }): Promise<Test[]> {
    const {
      maxPages = defaultPaginationOptions.maxPages,
      timeoutMs = defaultPaginationOptions.timeoutMs,
    } = options;

    const startTime = Date.now();
    const allTests: Test[] = [];
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
        `/project/${projectSlug}/${jobNumber}/tests`,
        params,
      );

      // Validate the response against our TestResponse schema
      const result = TestResponseSchema.parse(rawResult);

      pageCount++;
      allTests.push(...result.items);
      nextPageToken = result.next_page_token;
    } while (nextPageToken);

    return allTests;
  }
}
