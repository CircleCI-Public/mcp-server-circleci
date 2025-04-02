import { z } from 'zod';
import { HTTPClient } from '../circleci/httpClient.js';
import { FollowedProject } from '../schemas.js';

const FollowedProjectResponseSchema = z.object({
  items: z.array(FollowedProject),
  next_page_token: z.string().nullable(),
});

type FollowedProjectResponse = z.infer<typeof FollowedProjectResponseSchema>;

export class MeAPI {
  protected client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  /**
   * Get the projects that the user is following
   * @returns The projects that the user is following
   */
  async getFollowedProjects() {
    const result = await this.client.get<FollowedProjectResponse>(
      '/me/followed-projects',
    );
    return FollowedProjectResponseSchema.safeParse(result);
  }
}
