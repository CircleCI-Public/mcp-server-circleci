import { createPromptTemplateInputSchema } from './inputSchema.js';
import {
  PromptOrigin,
  promptsOutputDirectory,
  PromptWorkbenchToolName,
  fileNameTemplate,
  fileNameExample1,
  fileNameExample2,
  fileNameExample3,
  defaultModel,
} from '../shared/types.js';

const paramsKey = 'params';
const promptKey = 'prompt';
const promptOriginKey = 'promptOrigin';
const templateKey = 'template';
const contextSchemaKey = '`contextSchema`';
const modelKey = 'model';

export const createPromptTemplateTool = {
  name: PromptWorkbenchToolName.create_prompt_template,
  description: `
  ABOUT THIS TOOL:
  - This tool is part of a toolchain that generates and provides test cases for a prompt template.
  - This tool helps an AI assistant to generate a prompt template based on one of the following:
    1. feature requirements defined by a user - in which case the tool will generate a new prompt template based on the feature requirements.
    2. a pre-existing prompt or prompt template that a user wants to test, evaluate, or modify - in which case the tool will convert it into a more structured and testable prompt template while leaving the original prompt language relatively unchanged.
  - This tool will return a structured prompt template (e.g. \`${templateKey}\`) along with a context schema (e.g. \`${contextSchemaKey}\`) that defines the expected input parameters for the prompt template.
  - In some cases, a user will want to add test coverage for ALL of the prompts in a given application. In these cases, the AI agent should use this tool to generate a prompt template for each prompt in the application, and should check the entire application for AI prompts that are not already covered by a prompt template in the \`${promptsOutputDirectory}\` directory.

  WHEN SHOULD THIS TOOL BE TRIGGERED?
  - This tool should be triggered whenever the user provides requirements for a new AI-enabled application or a new AI-enabled feature of an existing  application (i.e. one that requires a prompt request to an LLM or any AI model).
  - This tool should also be triggered if the user provides a pre-existing prompt or prompt template from their codebase that they want to test, evaluate, or modify.
  - This tool should be triggered even if there are pre-existing files in the \`${promptsOutputDirectory}\` directory with the \`${fileNameTemplate}\` convention (e.g. \`${fileNameExample1}\`, \`${fileNameExample2}\`, \`${fileNameExample3}\`, etc.). Similar files should NEVER be generated directly by the AI agent. Instead, the AI agent should use this tool to first generate a new prompt template.

  PARAMETERS:
  - ${paramsKey}: object
    - ${promptKey}: string (the feature requirements or pre-existing prompt/prompt template that will be used to generate a prompt template. Can be a multi-line string.)
    - ${promptOriginKey}: "${PromptOrigin.codebase}" | "${PromptOrigin.requirements}" (indicates whether the prompt comes from an existing codebase or from new requirements)
    - ${modelKey}: string (the model that the prompt template will be tested against. Explicitly specify the model if it can be inferred from the codebase. Otherwise, defaults to \`${defaultModel}\`.)

  EXAMPLE USAGE (from new requirements):
  {
    "${paramsKey}": {
      "${promptKey}": "Create an app that takes any topic and an age (in years), then renders a 1-minute bedtime story for a person of that age.",
      "${promptOriginKey}": "${PromptOrigin.requirements}"
      "${modelKey}": "${defaultModel}"
    }
  }

  EXAMPLE USAGE (from pre-existing prompt/prompt template in codebase):
  {
    "${paramsKey}": {
      "${promptKey}": "The user wants a bedtime story about {{topic}} for a person of age {{age}} years old. Please craft a captivating tale that captivates their imagination and provides a delightful bedtime experience.",
      "${promptOriginKey}": "${PromptOrigin.codebase}"
      "${modelKey}": "claude-3-5-sonnet-latest"
    }
  }

  TOOL OUTPUT INSTRUCTIONS:
  - The tool will return...
    - a \`${templateKey}\` that reformulates the user's prompt into a more structured format.
    - a \`${contextSchemaKey}\` that defines the expected input parameters for the template.
    - a \`${promptOriginKey}\` that indicates whether the prompt comes from an existing prompt or prompt template in the user's codebase or from new requirements.
  - The tool output -- the \`${templateKey}\`, \`${contextSchemaKey}\`, and \`${promptOriginKey}\` -- will also be used as input to the \`${PromptWorkbenchToolName.recommend_prompt_template_tests}\` tool to generate a list of recommended tests that can be used to test the prompt template.
  `,
  inputSchema: createPromptTemplateInputSchema,
};
