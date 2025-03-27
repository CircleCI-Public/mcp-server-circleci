import { Job } from '../types.js';
import { HTTPClient } from './httpClient.js';

export class WorkflowsAPI {
  protected client: HTTPClient;

  constructor(token: string) {
    this.client = new HTTPClient('https://circleci.com/api/v2', {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}
