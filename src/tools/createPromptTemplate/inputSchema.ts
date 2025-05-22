import { z } from 'zod';
import { defaultModel, PromptOrigin } from '../shared/types.js';

export const createPromptTemplateInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      "The user's application, feature, or product requirements that will be used to generate a prompt template. Alternatively, a pre-existing prompt or prompt template can be provided if a user wants to test, evaluate, or modify it. (Can be a multi-line string.)",
    ),
  promptOrigin: z
    .enum([PromptOrigin.codebase, PromptOrigin.requirements])
    .describe(
      `The origin of the prompt - either "${PromptOrigin?.codebase}" for existing prompts from the codebase, or "${PromptOrigin?.requirements}" for new prompts from requirements.`,
    ),
  model: z
    .string()
    .default(defaultModel)
    .describe(
      `The model that the prompt template will be tested against. Explicitly specify the model if it can be inferred from the codebase. Otherwise, defaults to \`${defaultModel}\`.`,
    ),
});
