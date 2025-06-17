// SHARED CIRCLECI TOOL DESCRIPTION CONSTANTS
export const projectSlugDescription = `The project slug from listFollowedProjects tool (e.g., "gh/organization/project"). When using this option, branch must also be provided.`;
export const projectSlugDescriptionNoBranch = `The project slug from listFollowedProjects tool (e.g., "gh/organization/project").`;
export const branchDescription = `The name of the branch currently checked out in local workspace. This should match local git branch. For example: "feature/my-branch", "bugfix/123", "main", "master" etc.`;
export const option1DescriptionBranchRequired = `Option 1 - Project Slug and branch (BOTH required):
    - projectSlug: The project slug obtained from listFollowedProjects tool (e.g., "gh/organization/project")
    - branch: The name of the branch (required when using projectSlug)`;
export const workflowUrlDescription =
  'The URL of the CircleCI workflow or job. Can be any of these formats:\n' +
  '- Workflow URL: https://app.circleci.com/pipelines/:vcsType/:orgName/:projectName/:pipelineNumber/workflows/:workflowId' +
  '- Job URL: https://app.circleci.com/pipelines/:vcsType/:orgName/:projectName/:pipelineNumber/workflows/:workflowId/jobs/:buildNumber';

// PROMPT TEMPLATE ITERATION & TESTING TOOL CONSTANTS
// NOTE: We want to be extremely consistent with the tool names and parameters passed through the Prompt Workbench toolchain, since one tool's output may be used as input for another tool.
export const defaultModel = 'gpt-4.1-mini';
export const defaultTemperature = 1.0;
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
