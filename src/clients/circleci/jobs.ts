import { CircleCIClient } from './index.js';

interface JobDetails {
  web_url: string;
  project: {
    slug: string;
    name: string;
    external_url: string;
  };
  parallel_runs: number[];
  started_at: string;
  latest_workflow: {
    id: string;
    name: string;
  };
  name: string;
  executor: {
    type: string;
    resource_class: string;
  };
  parallelism: number;
  status: string;
  number: number;
  pipeline: {
    id: string;
  };
  duration: number;
  created_at: string;
  messages: string[];
  contexts: string[];
  organization: {
    name: string;
  };
  queued_at: string;
  stopped_at: string;
}

export class JobsAPI extends CircleCIClient {
  constructor(token: string) {
    super(token);
  }

  /**
   * Get job details by job number
   * @param projectSlug The project slug (e.g., "gh/CircleCI-Public/api-preview-docs")
   * @param jobNumber The number of the job
   * @returns Job details
   */
  async getJobByNumber(
    projectSlug: string,
    jobNumber: number,
  ): Promise<JobDetails> {
    const result = await this.get<JobDetails>(
      `/project/${projectSlug}/job/${jobNumber}`,
    );
    return result;
  }
}
