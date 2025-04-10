import { CircleCIPrivateClients } from '../../clients/circleci-private/index.js';
import { getVCSFromHost } from './vcsTool.js';
import gitUrlParse from 'parse-github-url';

/**
 * Identify the project slug from the git remote URL
 * @param {string} gitRemoteURL - eg: https://github.com/organization/project.git
 * @returns {string} project slug - eg: gh/organization/project
 */
export const identifyProjectSlug = async ({
  token,
  gitRemoteURL,
}: {
  token: string;
  gitRemoteURL: string;
}) => {
  const cciPrivateClients = new CircleCIPrivateClients({
    token,
  });

  const parsedGitURL = gitUrlParse(gitRemoteURL);
  if (!parsedGitURL?.host) {
    return null;
  }

  const vcs = getVCSFromHost(parsedGitURL.host);
  if (!vcs) {
    throw new Error(`VCS with host ${parsedGitURL.host} is not handled`);
  }

  const followedProjects = await cciPrivateClients.me.getFollowedProjects();
  if (!followedProjects.success) {
    throw new Error('Failed to get followed projects');
  }

  const project = followedProjects.data.items.find(
    (followedProject) =>
      followedProject.name === parsedGitURL.name &&
      followedProject.vcs_type === vcs.name,
  );

  return project?.slug;
};

/**
 * Get the pipeline number from the URL
 * @param {string} url - CircleCI pipeline URL
 * @returns {number} The pipeline number
 * @example
 * // Standard pipeline URL
 * getPipelineNumberFromURL('https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv')
 * // returns 2
 *
 * @example
 * // Pipeline URL with complex project path
 * getPipelineNumberFromURL('https://app.circleci.com/pipelines/circleci/GM1mbrQEWnNbzLKEnotDo4/5gh9pgQgohHwicwomY5nYQ/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv')
 * // returns 123
 */
export const getPipelineNumberFromURL = (url: string): number => {
  const parts = url.split('/');
  const pipelineIndex = parts.indexOf('pipelines');
  if (pipelineIndex === -1) {
    throw new Error('Invalid CircleCI URL format');
  }
  const pipelineNumber = parts[pipelineIndex + 4];

  if (!pipelineNumber) {
    throw new Error('Unable to extract pipeline number from URL');
  }

  const parsedNumber = Number(pipelineNumber);
  if (isNaN(parsedNumber)) {
    throw new Error('Pipeline number in URL is not a valid number');
  }

  return parsedNumber;
};

/**
 * Get the project slug from the URL
 * @param {string} url - CircleCI pipeline or project URL
 * @returns {string} project slug - eg: gh/organization/project
 * @example
 * // Pipeline URL with workflow
 * getProjectSlugFromURL('https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv')
 * // returns 'gh/organization/project'
 *
 * @example
 * // Simple project URL
 * getProjectSlugFromURL('https://app.circleci.com/pipelines/gh/organization/project')
 * // returns 'gh/organization/project'
 */
export const getProjectSlugFromURL = (url: string) => {
  const parts = url.split('/');
  const pipelineIndex = parts.indexOf('pipelines');
  if (pipelineIndex === -1) {
    throw new Error('Invalid CircleCI URL format');
  }
  const vcs = parts[pipelineIndex + 1];
  const org = parts[pipelineIndex + 2];
  const project = parts[pipelineIndex + 3];

  if (!vcs || !org || !project) {
    throw new Error('Unable to extract project information from URL');
  }

  return `${vcs}/${org}/${project}`;
};
