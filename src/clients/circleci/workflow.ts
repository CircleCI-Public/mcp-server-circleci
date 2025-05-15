import { HTTPClient } from './httpClient.js';
import { Workflow } from '../schemas.js';
export class GetWorkflowAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Get workflow
   * @param workflowId The workflowId
   * @returns The workflow object
   * @throws Error if the request fails
   */
  async getWorkflow({
    workflowId,
  }: {
    workflowId: string;
    fromFailed?: boolean;
  }): Promise<Workflow> {
    const rawResult = await this.client.get<unknown>(`/workflow/${workflowId}`);
    const parsedResult = Workflow.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse workflow response');
    }

    return parsedResult.data;
  }
}
