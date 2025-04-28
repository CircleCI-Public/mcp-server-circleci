import { HTTPClient } from '../circleci/httpClient.js';
import { PromptObject } from '../schemas.js';
import { z } from 'zod';

export const WorkbenchResponseSchema = z
  .object({
    workbench: PromptObject,
  })
  .strict();

export type WorkbenchResponse = z.infer<typeof WorkbenchResponseSchema>;

export const RecommendedTestsResponseSchema = z.object({
  recommendedTests: z.array(z.string()),
});

export type RecommendedTestsResponse = z.infer<
  typeof RecommendedTestsResponseSchema
>;

export class CircletAPI {
  protected client: HTTPClient;

  constructor(client: HTTPClient) {
    this.client = client;
  }

  async createPromptTemplate(prompt: string): Promise<PromptObject> {
    const result = await this.client.post<WorkbenchResponse>('/workbench', {
      prompt,
    });

    const parsedResult = WorkbenchResponseSchema.safeParse(result);

    if (!parsedResult.success) {
      throw new Error(
        `Failed to parse workbench response. Error: ${parsedResult.error.message}`,
      );
    }

    return parsedResult.data.workbench;
  }

  async recommendPromptTemplateTests({
    template,
    contextSchema,
  }: {
    template: string;
    contextSchema: Record<string, string>;
  }): Promise<string[]> {
    const result = await this.client.post<RecommendedTestsResponse>(
      '/recommended-tests',
      {
        template,
        contextSchema,
      },
    );

    const parsedResult = RecommendedTestsResponseSchema.safeParse(result);

    if (!parsedResult.success) {
      throw new Error(
        `Failed to parse recommended tests response. Error: ${parsedResult.error.message}`,
      );
    }

    return parsedResult.data.recommendedTests;
  }
}
