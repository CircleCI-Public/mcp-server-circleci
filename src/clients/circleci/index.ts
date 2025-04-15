import { HTTPClient } from './httpClient.js';
import { JobsAPI } from './jobs.js';
import { JobsV1API } from './jobsV1.js';
import { InsightsAPI } from './insights.js';
import { PipelinesAPI } from './pipelines.js';
import { WorkflowsAPI } from './workflows.js';
import { TestsAPI } from './tests.js';
import { ConfigValidateAPI } from './configValidate.js';
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
    'User-Agent': 'CircleCI-MCP-Server/0.1',
  });

  return headers;
}

/**
 * Creates a default HTTP client for the CircleCI API v2
 * @param options Configuration parameters
 * @param options.token CircleCI API token
 * @param options.baseURL Base URL for the CircleCI API v2
 * @returns HTTP client for CircleCI API v2
 */
const defaultV2HTTPClient = (options: { token: string }) => {
  if (!options.token) {
    throw new Error('Token is required');
  }

  const headers = createCircleCIHeaders({ token: options.token });
  return new HTTPClient('/api/v2', { headers });
};

/**
 * Creates a default HTTP client for the CircleCI API v1
 * @param options Configuration parameters
 * @param options.token CircleCI API token
 * @param options.baseURL Base URL for the CircleCI API v1
 * @returns HTTP client for CircleCI API v1
 */
const defaultV1HTTPClient = (options: { token: string; baseURL?: string }) => {
  if (!options.token) {
    throw new Error('Token is required');
  }

  const headers = createCircleCIHeaders({ token: options.token });
  return new HTTPClient('/api/v1.1', { headers });
};

const defaultApiSubdomainV2HTTPClient = (options: {
  token: string;
  baseURL?: string;
}) => {
  if (!options.token) {
    throw new Error('Token is required');
  }

  const headers = createCircleCIHeaders({ token: options.token });
  return new HTTPClient('/api/v2', { headers, useAPISubdomain: true });
};

/**
 * Creates a default HTTP client for the CircleCI API v2
 * @param options Configuration parameters
 * @param options.token CircleCI API token
 * @param options.baseURL Base URL for the CircleCI API v2
 */
export class CircleCIClients {
  protected apiPathV2 = '/api/v2';
  protected apiPathV1 = '/api/v1.1';

  public jobs: JobsAPI;
  public pipelines: PipelinesAPI;
  public workflows: WorkflowsAPI;
  public jobsV1: JobsV1API;
  public insights: InsightsAPI;
  public tests: TestsAPI;
  public configValidate: ConfigValidateAPI;
  constructor({
    token,
    v2httpClient = defaultV2HTTPClient({
      token,
    }),
    v1httpClient = defaultV1HTTPClient({
      token,
    }),
    apiSubdomainV2httpClient = defaultApiSubdomainV2HTTPClient({
      token,
    }),
  }: {
    token: string;
    baseURL?: string;
    v2httpClient?: HTTPClient;
    v1httpClient?: HTTPClient;
    apiSubdomainV2httpClient?: HTTPClient;
  }) {
    this.jobs = new JobsAPI(v2httpClient);
    this.pipelines = new PipelinesAPI(v2httpClient);
    this.workflows = new WorkflowsAPI(v2httpClient);
    this.jobsV1 = new JobsV1API(v1httpClient);
    this.insights = new InsightsAPI(v2httpClient);
    this.tests = new TestsAPI(v2httpClient);
    this.configValidate = new ConfigValidateAPI(apiSubdomainV2httpClient); // needs to have a baseURL of api.circleci.com
  }
}
