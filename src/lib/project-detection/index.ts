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
 * @param {string} url - eg: https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv
 * @returns {string} pipeline number - eg: 2
 */
export const getPipelineNumberFromURL = (url: string) => {
  const parts = url.split('/');
  return parts[7];
};

/**
 * Get the project slug from the URL
 * @param {string} url - eg: https://app.circleci.com/pipelines/gh/organization/project/2/workflows/abc123de-f456-78gh-90ij-klmnopqrstuv
 * @returns {string} project slug - eg: gh/organization/project
 */
export const getProjectSlugFromURL = (url: string) => {
  const parts = url.split('/');
  return `${parts[4]}/${parts[5]}/${parts[6]}`;
};
