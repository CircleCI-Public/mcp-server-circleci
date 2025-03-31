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
