import { z } from 'zod';
import { HTTPClient } from '../circleci/httpClient.js';

const JobOutputResponseSchema = z.string();

const JobErrorResponseSchema = z.string();

type JobOutputResponse = z.infer<typeof JobOutputResponseSchema>;
type JobErrorResponse = z.infer<typeof JobErrorResponseSchema>;

export class JobsPrivate {
  protected client: HTTPClient;
  private static requestCount = 0;
  private static readonly BATCH_SIZE = 1;
  private static readonly BATCH_DELAY = 100; // milliseconds

  private static async checkRateLimit() {
    this.requestCount++;
    if (this.requestCount >= this.BATCH_SIZE) {
      await new Promise((resolve) => setTimeout(resolve, this.BATCH_DELAY));
      this.requestCount = 0;
    }
  }

  constructor(client: HTTPClient) {
    this.client = client;
  }
  /**
   * Get detailed information about a specific job
   * @param params Configuration parameters
   * @param params.projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param params.jobNumber The number of the job
   * @param params.taskIndex The index of the task
   * @param params.stepId The id of the step
   * @returns Detailed job information including status, timing, and build details
   */
  async getStepOutput({
    projectSlug,
    jobNumber,
    taskIndex,
    stepId,
  }: {
    projectSlug: string;
    jobNumber: number;
    taskIndex: number;
    stepId: number;
  }) {
    await JobsPrivate.checkRateLimit();

    // /api/private/output/raw/:vcs/:user/:prj/:num/output/:task_index/:step_id
    const outputResult = await this.client.get<JobOutputResponse>(
      `/output/raw/${projectSlug}/${jobNumber}/output/${taskIndex}/${stepId}`,
    );
    const parsedOutput = JobOutputResponseSchema.safeParse(outputResult);

    await JobsPrivate.checkRateLimit();

    // /api/private/output/raw/:vcs/:user/:prj/:num/error/:task_index/:step_id
    const errorResult = await this.client.get<JobErrorResponse>(
      `/output/raw/${projectSlug}/${jobNumber}/error/${taskIndex}/${stepId}`,
    );
    const parsedError = JobErrorResponseSchema.safeParse(errorResult);

    if (!parsedOutput.success || !parsedError.success) {
      throw new Error('Failed to parse job output or error response');
    }

    return {
      output: parsedOutput.data,
      error: parsedError.data,
    };
  }
}
