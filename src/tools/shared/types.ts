// NOTE: We want to be extremely consistent with the tool names and parameters passed through the Prompt Workbench toolchain, since one tool's output may be used as input for another tool.

export const defaultModel = 'gpt-4o-mini';

export const promptsOutputDirectory = './prompts';

export const fileExtension = '.prompt.yml';
export const fileNameTemplate = `<relevant-name>${fileExtension}`;
export const fileNameExample1 = `bedtime-story-generator${fileExtension}`;
export const fileNameExample2 = `plant-care-assistant${fileExtension}`;
export const fileNameExample3 = `customer-support-chatbot${fileExtension}`;

export enum PromptWorkbenchToolName {
  create_prompt_template = 'create_prompt_template',
  recommend_prompt_template_tests = 'recommend_prompt_template_tests',
}

// What is the origin of the Prompt Workbench toolchain request?
export enum PromptOrigin {
  codebase = 'codebase', // pre-existing prompts in user's codebase
  requirements = 'requirements', // new feature requirements provided by user
}
