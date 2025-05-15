import { HTTPClient } from './httpClient.js';
import { RerunWorkflowResponse } from '../schemas.js';
export class RerunWorkflowAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Rerun workflow from failed
   * @param workflowId The workflowId
   * @returns A new workflowId
   * @throws Error if the request fails
   */
  async rerunWorkflowFromFailed({
    workflowId,
  }: {
    workflowId: string;
  }): Promise<RerunWorkflowResponse> {
    const rawResult = await this.client.post<unknown>(
      `/workflow/${workflowId}/rerun`,
      {
        workflow_id: workflowId,
      },
    );
    const parsedResult = RerunWorkflowResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse workflow response');
    }

    return parsedResult.data;
  }
}
