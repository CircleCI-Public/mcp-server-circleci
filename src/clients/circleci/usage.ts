import {
  UsageExportJobStart,
  UsageExportJobStatus,
} from '../schemas.js';
import { HTTPClient } from './httpClient.js';



export class UsageAPI {
  private client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  /**
   * Starts a usage export job on CircleCI
   * @param orgId The organization ID
   * @param start The start date for the usage report in 'YYYY-MM-DD' format
   * @param end The end date for the usage report in 'YYYY-MM-DD' format
   * @returns The confirmation and ID for the newly created export job
   * @throws Will throw an error if the CircleCI API returns a non-OK response
   */
  async startUsageExportJob(
    orgId: string,
    start: string,
    end: string,
  ): Promise<UsageExportJobStart> {
    const responseData = await this.client.post<unknown>(
      `/organizations/${orgId}/usage_export_job`,
      { start, end },
    );
    const parsed = UsageExportJobStart.safeParse(responseData);
    if (!parsed.success) {
      throw new Error(
        `Failed to parse startUsageExportJob response: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }

  /**
   * Gets the status of a usage export job
   * @param orgId The organization ID
   * @param jobId The ID of the export job
   * @returns The status of the export job, including a download URL on success
   * @throws Will throw an error if the CircleCI API returns a non-OK response
   */
  async getUsageExportJobStatus(
    orgId: string,
    jobId: string,
  ): Promise<UsageExportJobStatus> {
    const responseData = await this.client.get<unknown>(
      `/organizations/${orgId}/usage_export_job/${jobId}`,
    );
    const parsed = UsageExportJobStatus.safeParse(responseData);
    if (!parsed.success) {
      throw new Error(
        `Failed to parse getUsageExportJobStatus response: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }
}
