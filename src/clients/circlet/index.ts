import { HTTPClient } from '../circleci/httpClient.js';
import { CircletAPI } from './circlet.js';

/**
 * Creates a default HTTP client for the CircleCI API private
 * @param options Configuration parameters
 * @param options.token CircleCI API token
 * @param options.baseURL Base URL for the CircleCI API private
 * @returns HTTP client for CircleCI API private
 */
const defaultV1HTTPClient = () => {
  return new HTTPClient('https://circlet.ai', '/api/v1');
};

export class CircletClient {
  public circlet: CircletAPI;

  constructor({
    httpClient = defaultV1HTTPClient(),
  }: {
    httpClient?: HTTPClient;
  } = {}) {
    this.circlet = new CircletAPI(httpClient);
  }
}
