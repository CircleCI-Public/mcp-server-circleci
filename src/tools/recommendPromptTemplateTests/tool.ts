import { recommendPromptTemplateTestsInputSchema } from './inputSchema.js';
import { PromptWorkbenchToolName, PromptOrigin } from '../shared/types.js';
import { modelKey } from '../createPromptTemplate/handler.js';

const paramsKey = 'params';
const promptTemplateKey = 'promptTemplate';
const contextSchemaKey = 'contextSchema';
const promptOriginKey = 'promptOrigin';
const recommendedTestsVar = '`recommendedTests`';

export const recommendPromptTemplateTestsTool = {
  name: PromptWorkbenchToolName.recommend_prompt_template_tests,
  description: `
  About this tool:
  - This tool is part of a toolchain that generates and provides test cases for a prompt template.
  - This tool generates an array of recommended tests for a given prompt template.

  Parameters:
  - ${paramsKey}: object
    - ${promptTemplateKey}: string (the prompt template to be tested)
    - ${contextSchemaKey}: object (the context schema that defines the expected input parameters for the prompt template)
    - ${promptOriginKey}: "${PromptOrigin.codebase}" | "${PromptOrigin.requirements}" (indicates whether the prompt comes from an existing codebase or from new requirements)
    - ${modelKey}: string (the model that the prompt template will be tested against)
    
  Example usage:
  {
    "${paramsKey}": {
      "${promptTemplateKey}": "The user wants a bedtime story about {{topic}} for a person of age {{age}} years old. Please craft a captivating tale that captivates their imagination and provides a delightful bedtime experience.",
      "${contextSchemaKey}": {
        "topic": "string",
        "age": "number"
      },
      "${promptOriginKey}": "${PromptOrigin.codebase}"
    }
  }

  The tool will return a structured array of test cases that can be used to test the prompt template.

  Tool output instructions:
    - The tool will return a ${recommendedTestsVar} array that can be used to test the prompt template.
  `,
  inputSchema: recommendPromptTemplateTestsInputSchema,
};
