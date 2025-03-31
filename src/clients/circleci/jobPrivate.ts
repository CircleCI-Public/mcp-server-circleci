import { HTTPClient } from './httpClient.js';
import { createCircleCIHeaders } from './index.js';

type JobOutputResponse = {
  output: string;
};

type JobErrorResponse = {
  error: string;
};

// TODO: move this into circleci-private
export class JobsPrivate {
  protected client: HTTPClient;

  constructor(token: string) {
    this.client = new HTTPClient(
      'https://circleci.com/api/private',
      createCircleCIHeaders({ token }),
    );
  }
  /**
   * Get detailed information about a specific job
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.jobNumber The number of the job
   * @returns Detailed job information including status, timing, and build details
   */
  async getJobDetails({
    projectSlug,
    jobNumber,
    taskIndex,
    stepId,
  }: {
    projectSlug: string;
    jobNumber: number;
    taskIndex: number;
    stepId: number;
  }): Promise<{ output: string; error: string }> {
    // /api/private/output/raw/:vcs/:user/:prj/:num/output/:task_index/:step_id
    const output = await this.client.get<JobOutputResponse>(
      `/output/raw/${projectSlug}/${jobNumber}/output/${taskIndex}/${stepId}`,
    );

    // /api/private/output/raw/:vcs/:user/:prj/:num/error/:task_index/:step_id
    const error = await this.client.get<JobErrorResponse>(
      `/output/raw/${projectSlug}/${jobNumber}/error/${taskIndex}/${stepId}`,
    );

    return {
      output: output.output,
      error: error.error,
    };
  }
}
