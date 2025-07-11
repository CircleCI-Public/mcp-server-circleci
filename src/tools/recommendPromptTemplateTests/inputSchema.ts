import { z } from 'zod';
import {
  defaultModel,
  defaultTemperature,
  PromptOrigin,
  PromptWorkbenchToolName,
} from '../shared/constants.js';

export const recommendPromptTemplateTestsInputSchema = z.object({
  template: z
    .string()
    .describe(
      `The prompt template to be tested. Use the \`promptTemplate\` from the latest \`${PromptWorkbenchToolName.create_prompt_template}\` tool output (if available).`,
    ),
  contextSchema: z
    .record(z.string(), z.string())
    .describe(
      `The context schema that defines the expected input parameters for the prompt template. Use the \`contextSchema\` from the latest \`${PromptWorkbenchToolName.create_prompt_template}\` tool output.`,
    ),
  promptOrigin: z
    .nativeEnum(PromptOrigin)
    .describe(
      `The origin of the prompt template, indicating where it came from (e.g. "${PromptOrigin.codebase}" or "${PromptOrigin.requirements}").`,
    ),
  model: z
    .string()
    .default(defaultModel)
    .describe(
      `The model to use for generating actual prompt outputs for testing. Defaults to ${defaultModel}.`,
    ),
  temperature: z
    .number()
    .default(defaultTemperature)
    .describe(
      `The temperature of the prompt template. Explicitly specify the temperature if it can be inferred from the codebase. Otherwise, defaults to ${defaultTemperature}.`,
    ),
});
