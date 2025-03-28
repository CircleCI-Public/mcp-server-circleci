import { JobsAPI } from './jobs.js';
import { JobsV1API } from './jobsV1.js';
import { PipelinesAPI } from './pipelines.js';
import { WorkflowsAPI } from './workflows.js';

export const defaultPaginationOptions = {
  maxPages: 5,
  timeoutMs: 10000,
  findFirst: false,
} as const;

/**
 * Creates standardized headers for CircleCI API clients
 * @param params Configuration parameters
 * @param params.token CircleCI API token
 * @param params.additionalHeaders Optional headers to merge with defaults (will not override critical headers)
 * @returns Headers object for fetch API
 */
export function createCircleCIHeaders({
  token,
  additionalHeaders = {},
}: {
  token: string;
  additionalHeaders?: HeadersInit;
}): HeadersInit {
  const headers = additionalHeaders;
  Object.assign(headers, {
    'Circle-Token': token,
    'Content-Type': 'application/json',
  });

  return headers;
}

export class CircleCIClients {
  public jobs: JobsAPI;
  public pipelines: PipelinesAPI;
  public workflows: WorkflowsAPI;
  public jobsV1: JobsV1API;

  constructor(token: string) {
    this.jobs = new JobsAPI(token);
    this.pipelines = new PipelinesAPI(token);
    this.workflows = new WorkflowsAPI(token);
    this.jobsV1 = new JobsV1API(token);
  }
}
