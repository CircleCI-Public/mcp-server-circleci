import { z } from 'zod';
import {
  defaultModel,
  PromptOrigin,
  PromptWorkbenchToolName,
} from '../shared/types.js';

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
});
