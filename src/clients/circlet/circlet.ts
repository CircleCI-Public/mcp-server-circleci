import { HTTPClient } from '../circleci/httpClient.js';
import { PromptObject } from '../circletSchemas.js';
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

  async generate(prompt: string) {
    const result = await this.client.post('/workbench', {
      body: { prompt },
    });

    return responseSchema.safeParse(result);
  }
}
