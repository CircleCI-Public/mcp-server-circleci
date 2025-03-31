import { HTTPClient } from '../circleci/httpClient.js';

type FollowedProject = {
  default_branch: string | null;
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  slug: string;
  vcs_type: string;
};

type FollowedProjectResponse = {
  items: FollowedProject[];
  next_page_token: string | null;
};

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
    return result;
  }
}
