import { DeployComponentsResponse, DeployComponentVersionsResponse, DeployEnvironmentResponse, DeploySettingsResponse, RollbackProjectRequest, RollbackProjectResponse } from '../schemas.js';
import { HTTPClient } from './httpClient.js';

export class DeploysAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  async runRollbackPipeline({
    projectID,
    rollbackRequest,
  }: {
    projectID: string;
    rollbackRequest: RollbackProjectRequest;
  }): Promise<RollbackProjectResponse> {
    const rawResult = await this.client.post<unknown>(
      `/projects/${projectID}/rollback`,
      rollbackRequest,
    );

    const parsedResult = RollbackProjectResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error(`Failed to parse rollback response: ${parsedResult.error.message}`);
    }

    return parsedResult.data;
  }

  async fetchComponentVersions({
    componentID,
    environmentID,
  }: {
    componentID: string;
    environmentID: string;
    workflowID?: string;
  }): Promise<DeployComponentVersionsResponse> {
    const rawResult = await this.client.get<unknown>(
      `/deploy/components/${componentID}/versions?environment-id=${environmentID}`
    );

    const parsedResult = DeployComponentVersionsResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error(`Failed to parse component versions: ${parsedResult.error.message}`);
    }

    return parsedResult.data;
  }

  async fetchEnvironments({
    orgID,
  }: {
    orgID: string;
  }): Promise<DeployEnvironmentResponse> {
    const rawResult = await this.client.get<unknown>(
      `/deploy/environments?org-id=${orgID}`
    );

    const parsedResult = DeployEnvironmentResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error(`Failed to parse environments: ${parsedResult.error.message}`);
    }

    return parsedResult.data;
  }

  async fetchProjectComponents({
    projectID,
    orgID,
  }: {
    projectID: string;
    orgID: string;
  }): Promise<DeployComponentsResponse> {
    const rawResult = await this.client.get<unknown>(
      `/deploy/components?org-id=${orgID}&project-id=${projectID}`
    );

    const parsedResult = DeployComponentsResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error(`Failed to parse components: ${parsedResult.error.message}`);
    }

    return parsedResult.data;
  }

  async fetchProjectDeploySettings({
    projectID,
  }: {
    projectID: string;
  }): Promise<DeploySettingsResponse> {
    const rawResult = await this.client.get<unknown>(
      `/deploy/projects/${projectID}/settings`
    );

    const parsedResult = DeploySettingsResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error(`Failed to parse project deploy settings: ${parsedResult.error.message}`);
    }

    return parsedResult.data;
  }
}

