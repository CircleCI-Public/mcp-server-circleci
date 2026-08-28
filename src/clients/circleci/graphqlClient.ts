import { HTTPClient } from './httpClient.js';

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export class GraphQLClient {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const body: Record<string, unknown> = { query };
    if (variables) body.variables = variables;

    const response = await this.client.post<GraphQLResponse<T>>('', body);

    if (response.errors && response.errors.length > 0) {
      const messages = response.errors.map((e) => e.message).join('; ');
      throw new Error(`CircleCI GraphQL error: ${messages}`);
    }

    if (!response.data) {
      throw new Error('CircleCI GraphQL error: no data returned');
    }

    return response.data;
  }
}
