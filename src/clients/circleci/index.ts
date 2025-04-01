import { HTTPClient } from './httpClient.js';
import { JobsAPI } from './jobs.js';
import { JobsV1API } from './jobsV1.js';
import { PipelinesAPI } from './pipelines.js';
import { WorkflowsAPI } from './workflows.js';

export type TCircleCIClient = InstanceType<typeof CircleCIClients>;

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

/**
 * Creates a default HTTP client for the CircleCI API v2
 * @param token CircleCI API token
 * @returns HTTP client for CircleCI API v2
 */
const defaultV2HTTPClient = (token: string) => {
  if (!token) {
    throw new Error('Token is required');
  }
  const headers = createCircleCIHeaders({ token });
  return new HTTPClient('https://circleci.com/api/v2', headers);
};

/**
 * Creates a default HTTP client for the CircleCI API v1
 * @param token CircleCI API token
 * @returns HTTP client for CircleCI API v1
 */
const defaultV1HTTPClient = (token: string) => {
  if (!token) {
    throw new Error('Token is required');
  }
  const headers = createCircleCIHeaders({ token });
  return new HTTPClient('https://circleci.com/api/v1.1', headers);
};

export class CircleCIClients {
  public jobs: JobsAPI;
  public pipelines: PipelinesAPI;
  public workflows: WorkflowsAPI;
  public jobsV1: JobsV1API;

  constructor({
    token,
    v2httpClient = defaultV2HTTPClient(token),
    v1httpClient = defaultV1HTTPClient(token),
  }: {
    token: string;
    v2httpClient?: HTTPClient;
    v1httpClient?: HTTPClient;
  }) {
    this.jobs = new JobsAPI(v2httpClient);
    this.pipelines = new PipelinesAPI(v2httpClient);
    this.workflows = new WorkflowsAPI(v2httpClient);
    this.jobsV1 = new JobsV1API(v1httpClient);
  }
}
