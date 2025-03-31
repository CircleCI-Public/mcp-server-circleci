import { CircleCIPrivateClients } from '../../clients/circleci-private/index.js';

export const identifyProjectSlug = async (token: string) => {
  const cciPrivateClients = new CircleCIPrivateClients({
    token,
  });

  const followedProjects = await cciPrivateClients.me.getFollowedProjects();

  const project = followedProjects.items.find(
    (project) => project.name === 'hungry-panda',
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
