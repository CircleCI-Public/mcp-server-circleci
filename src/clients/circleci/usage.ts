import { HTTPClient } from './httpClient.js';

export class UsageAPI {
  private client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async startUsageExportJob(orgId: string, start: string, end: string) {
    return this.client.post(
      `/organizations/${orgId}/usage_export_job`,
      { start, end }
    );
  }

  async getUsageExportJobStatus(orgId: string, jobId: string) {
    return this.client.get(
      `/organizations/${orgId}/usage_export_job/${jobId}`
    );
  }
} 