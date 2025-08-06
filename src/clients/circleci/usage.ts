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
   * @returns The initial response from the CircleCI API after starting the job
   * @throws Will throw an error if the CircleCI API returns a non-OK response
   */
  async startUsageExportJob(orgId: string, start: string, end: string) {
    return this.client.post(
      `/organizations/${orgId}/usage_export_job`,
      { start, end }
    );
  }

  /**
   * Gets the status of a usage export job
   * @param orgId The organization ID
   * @param jobId The ID of the export job
   * @returns The current status of the job which can be checked for a download URL
   * @throws Will throw an error if the CircleCI API returns a non-OK response
   */
  async getUsageExportJobStatus(orgId: string, jobId: string) {
    return this.client.get(
      `/organizations/${orgId}/usage_export_job/${jobId}`
    );
  }
} 