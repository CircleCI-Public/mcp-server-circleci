import { HTTPClient } from '../circleci/httpClient.js';
import { PromptObject, RuleReview } from '../schemas.js';
import { z } from 'zod';
import { PromptOrigin } from '../../tools/shared/constants.js';

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

  async createPromptTemplate(
    prompt: string,
    promptOrigin: PromptOrigin,
  ): Promise<PromptObject> {
    const result = await this.client.post<WorkbenchResponse>('/workbench', {
      prompt,
      promptOrigin,
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

  async ruleReview({
    diff,
    rules,
  }: {
    diff: string;
    rules: string;
  }): Promise<RuleReview> {
    const rawResult = await this.client.post<unknown>('/rule-review', {
      changeSet: diff,
      rules,
    });
    const parsedResult = RuleReview.safeParse(rawResult);
    if (!parsedResult.success) {
      throw new Error(
        `Failed to parse rule review response. Error: ${parsedResult.error.message}`,
      );
    }
    return parsedResult.data;
  }
}
