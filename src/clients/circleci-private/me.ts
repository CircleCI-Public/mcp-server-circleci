import { z } from 'zod';
import { HTTPClient } from '../circleci/httpClient.js';
import { FollowedProject } from '../schemas.js';
import { defaultPaginationOptions } from '../circleci/index.js';

const FollowedProjectResponseSchema = z.object({
  items: z.array(FollowedProject),
  next_page_token: z.string().nullable(),
});

export class MeAPI {
  protected client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  /**
   * Get the projects that the user is following with pagination support
   * @param options Optional configuration for pagination limits
   * @param options.maxPages Maximum number of pages to fetch (default: 5)
   * @param options.timeoutMs Timeout in milliseconds (default: 10000)
   * @returns All followed projects
   * @throws Error if timeout or max pages reached
   */
  async getFollowedProjects(
    options: {
      maxPages?: number;
      timeoutMs?: number;
    } = {},
  ): Promise<FollowedProject[]> {
    const { maxPages = 20, timeoutMs = defaultPaginationOptions.timeoutMs } =
      options;

    const startTime = Date.now();
    const allProjects: FollowedProject[] = [];
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

      const params = nextPageToken ? { next_page_token: nextPageToken } : {};
      const rawResult = await this.client.get<unknown>(
        '/me/followed-projects',
        params,
      );

      // Validate the response against our schema
      const result = FollowedProjectResponseSchema.parse(rawResult);

      pageCount++;
      allProjects.push(...result.items);
      nextPageToken = result.next_page_token;
    } while (nextPageToken);

    return allProjects;
  }
}
