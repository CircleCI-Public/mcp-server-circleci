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

