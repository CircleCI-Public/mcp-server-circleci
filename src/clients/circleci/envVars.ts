import { HTTPClient } from './httpClient.js';

export interface EnvVar {
  name: string;
  value: string;
}

export interface EnvVarListResponse {
  items: EnvVar[];
  next_page_token: string | null;
}

export interface DeleteEnvVarResponse {
  message: string;
}

export class EnvVarsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * List all environment variables for a project (values are masked)
   * @param projectSlug The project slug (e.g., "gh/org/repo")
   * @returns List of environment variables
   */
  async listEnvVars({
    projectSlug,
  }: {
    projectSlug: string;
  }): Promise<EnvVarListResponse> {
    return this.client.get<EnvVarListResponse>(
      `/project/${projectSlug}/envvar`,
    );
  }

  /**
   * Create or update an environment variable for a project
   * @param projectSlug The project slug (e.g., "gh/org/repo")
   * @param name The name of the environment variable
   * @param value The value of the environment variable
   * @returns The created environment variable (value is masked)
   */
  async createEnvVar({
    projectSlug,
    name,
    value,
  }: {
    projectSlug: string;
    name: string;
    value: string;
  }): Promise<EnvVar> {
    return this.client.post<EnvVar>(`/project/${projectSlug}/envvar`, {
      name,
      value,
    });
  }

  /**
   * Delete an environment variable from a project
   * @param projectSlug The project slug (e.g., "gh/org/repo")
   * @param name The name of the environment variable to delete
   * @returns Confirmation message
   */
  async deleteEnvVar({
    projectSlug,
    name,
  }: {
    projectSlug: string;
    name: string;
  }): Promise<DeleteEnvVarResponse> {
    return this.client.delete<DeleteEnvVarResponse>(
      `/project/${projectSlug}/envvar/${name}`,
    );
  }
}
