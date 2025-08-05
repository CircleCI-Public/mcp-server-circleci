import { Project } from '../schemas.js';
import { HTTPClient } from './httpClient.js';

export class ProjectsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Get project info by slug
   * @param projectSlug The project slug
   * @returns The project info
   * @throws Error if the request fails
   */
  async getProject({ projectSlug }: { projectSlug: string }): Promise<Project> {
    const rawResult = await this.client.get<unknown>(`/project/${projectSlug}`);

    const parsedResult = Project.safeParse(rawResult);

    if (!parsedResult.success) {
      throw new Error('Failed to parse project response');
    }

    return parsedResult.data;
  }

  /**
   * Get project info by project ID (uses project ID as slug)
   * @param projectID The project ID
   * @returns The project info
   * @throws Error if the request fails
   */
  async getProjectByID({ projectID }: { projectID: string }): Promise<Project> {
    // For some integrations, project ID can be used directly as project slug
    const rawResult = await this.client.get<unknown>(`/project/${projectID}`);

    const parsedResult = Project.safeParse(rawResult);

    if (!parsedResult.success) {
      throw new Error('Failed to parse project response');
    }

    return parsedResult.data;
  }
}
