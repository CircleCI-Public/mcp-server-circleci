import { HTTPClient } from '../circleci/httpClient.js';
import { createCircleCIHeaders } from '../circleci/index.js';
import { JobsPrivate } from './jobsPrivate.js';
import { MeAPI } from './me.js';
import { getBaseURL } from '../circleci/index.js';

/**
 * Creates a default HTTP client for the CircleCI API private
 * @param options Configuration parameters
 * @param options.token CircleCI API token
 * @param options.baseURL Base URL for the CircleCI API private
 * @returns HTTP client for CircleCI API private
 */
const defaultPrivateHTTPClient = (options: { token: string }) => {
  if (!options.token) {
    throw new Error('Token is required');
  }

  const baseURL = getBaseURL();

  return new HTTPClient(baseURL, '/api/private', {
    headers: createCircleCIHeaders({ token: options.token }),
  });
};

export class CircleCIPrivateClients {
  public me: MeAPI;
  public jobs: JobsPrivate;
  constructor({
    token,
    privateHTTPClient = defaultPrivateHTTPClient({
      token,
    }),
  }: {
    token: string;
    privateHTTPClient?: HTTPClient;
  }) {
    this.me = new MeAPI(privateHTTPClient);
    this.jobs = new JobsPrivate(privateHTTPClient);
  }
}
