import { HTTPClient } from '../circleci/httpClient.js';
import { PromptObject } from '../schemas.js';
import { z } from 'zod';
export const requestSchema = z.object({
  prompt: z.string().nonempty(),
});

export const responseSchema = z
  .object({
    workbench: PromptObject,
  })
  .strict();

export class CircletAPI {
  protected client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async createPromptTemplate(prompt: string) {
    const result = await this.client.post('/workbench', { prompt });

    return responseSchema.safeParse(result);
  }
}
