import { getCircleCIPrivateClient } from '../../clients/client.js';
import { getVCSFromHost } from './vcsTool.js';
import gitUrlParse from 'parse-github-url';

/**
 * Identify the project slug from the git remote URL
 * @param {string} gitRemoteURL - eg: https://github.com/organization/project.git
 * @returns {string} project slug - eg: gh/organization/project
 */
export const identifyProjectSlug = async ({
  gitRemoteURL,
}: {
  gitRemoteURL: string;
}) => {
  const cciPrivateClients = getCircleCIPrivateClient();

  const parsedGitURL = gitUrlParse(gitRemoteURL);
  if (!parsedGitURL?.host) {
    return undefined;
  }

  const vcs = getVCSFromHost(parsedGitURL.host);
  if (!vcs) {
    throw new Error(`VCS with host ${parsedGitURL.host} is not handled`);
  }

  const followedProjects = await cciPrivateClients.me.getFollowedProjects();
  if (!followedProjects) {
    throw new Error('Failed to get followed projects');
  }

  const project = followedProjects.find(
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
export const getPipelineNumberFromURL = (url: string): number | undefined => {
  const parts = url.split('/');
  const pipelineIndex = parts.indexOf('pipelines');
  if (pipelineIndex === -1) {
    throw new Error('Invalid CircleCI URL format');
  }
  const pipelineNumber = parts[pipelineIndex + 4];

  if (!pipelineNumber) {
    return undefined;
  }

  const parsedNumber = Number(pipelineNumber);
  if (isNaN(parsedNumber)) {
    throw new Error('Pipeline number in URL is not a valid number');
  }

  return parsedNumber;
};

/**
 * Get the job number from the URL
 * @param {string} url - CircleCI job URL
 * @returns {number | undefined} The job number if present in the URL
 * @example
 * // Job URL
 * getJobNumberFromURL('https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv/jobs/456')
 * // returns 456
 *
 * @example
 * // URL without job number
 * getJobNumberFromURL('https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv')
 * // returns undefined
 */
export const getJobNumberFromURL = (url: string): number | undefined => {
  const parts = url.split('/');
  const jobsIndex = parts.indexOf('jobs');
  if (jobsIndex === -1 || jobsIndex + 1 >= parts.length) {
    return undefined;
  }

  const jobNumber = parts[jobsIndex + 1];
  if (!jobNumber) {
    return undefined;
  }

  const parsedNumber = Number(jobNumber);
  if (isNaN(parsedNumber)) {
    throw new Error('Job number in URL is not a valid number');
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
 * // Simple project URL with query parameters
 * getProjectSlugFromURL('https://app.circleci.com/pipelines/gh/organization/project?branch=main')
 * // returns 'gh/organization/project'
 */
export const getProjectSlugFromURL = (url: string) => {
  const urlWithoutQuery = url.split('?')[0];
  const parts = urlWithoutQuery.split('/');
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

/**
 * Get the branch name from the URL's query parameters
 * @param {string} url - CircleCI pipeline URL
 * @returns {string | undefined} The branch name if present in the URL
 * @example
 * // URL with branch parameter
 * getBranchFromURL('https://app.circleci.com/pipelines/gh/organization/project?branch=feature-branch')
 * // returns 'feature-branch'
 *
 * @example
 * // URL without branch parameter
 * getBranchFromURL('https://app.circleci.com/pipelines/gh/organization/project')
 * // returns undefined
 */
export const getBranchFromURL = (url: string): string | undefined => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('branch') || undefined;
  } catch {
    throw new Error('Invalid CircleCI URL format');
  }
};
