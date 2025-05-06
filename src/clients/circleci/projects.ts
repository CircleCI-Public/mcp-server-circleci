import { Project } from '../schemas.js';
import { HTTPClient } from './httpClient.js';

export class ProjectsAPI {
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
  async getProject({ projectSlug }: { projectSlug: string }): Promise<Project> {
    const rawResult = await this.client.get<unknown>(`/project/${projectSlug}`);

    const parsedResult = Project.safeParse(rawResult);

    if (!parsedResult.success) {
      throw new Error('Failed to parse project response');
    }

    return parsedResult.data;
  }
}
