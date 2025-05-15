import { HTTPClient } from './httpClient.js';
import { RerunWorkflowResponse } from '../schemas.js';
export class RerunWorkflowAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Rerun workflow from failed or started
   * @param workflowId The workflowId
   * @param fromFailed Whether to rerun from failed or started
   * @returns A new workflowId
   * @throws Error if the request fails
   */
  async rerunWorkflow({
    workflowId,
    fromFailed = true,
  }: {
    workflowId: string;
    fromFailed?: boolean;
  }): Promise<RerunWorkflowResponse> {
    const rawResult = await this.client.post<unknown>(
      `/workflow/${workflowId}/rerun`,
      {
        from_failed: fromFailed,
      },
    );
    const parsedResult = RerunWorkflowResponse.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error('Failed to parse workflow response');
    }

    return parsedResult.data;
  }
}
