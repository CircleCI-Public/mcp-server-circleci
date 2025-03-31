export type VCSDefinition = {
  host: 'github.com' | 'bitbucket.org' | 'circleci.com';
  name: 'github' | 'bitbucket' | 'circleci';
  short: 'gh' | 'bb' | 'circleci';
};

/**
 * Gitlab is not compatible with this representation
 * https://circleci.atlassian.net/browse/DEVEX-175
 */
export const vcses: VCSDefinition[] = [
  {
    host: 'github.com',
    name: 'github',
    short: 'gh',
  },
  {
    host: 'bitbucket.org',
    name: 'bitbucket',
    short: 'bb',
  },
  {
    host: 'circleci.com',
    name: 'circleci',
    short: 'circleci',
  },
];

export class UnhandledVCS extends Error {
  constructor(vcs: string) {
    super(`VCS ${vcs} is not handled at the moment`);
  }
}

export function getVCSFromHost(host: string): VCSDefinition | undefined {
  return vcses.find(({ host: vcsHost }) => host === vcsHost);
}

export function mustGetVCSFromHost(host: string): VCSDefinition {
  const vcs = getVCSFromHost(host);

  if (vcs === undefined) {
    throw new UnhandledVCS(host);
  }
  return vcs;
}

export function getVCSFromName(name: string): VCSDefinition | undefined {
  return vcses.find(({ name: vcsName }) => name === vcsName);
}

export function mustGetVCSFromName(name: string): VCSDefinition {
  const vcs = getVCSFromName(name);

  if (vcs === undefined) {
    throw new UnhandledVCS(name);
  }
  return vcs;
}

export function getVCSFromShort(short: string): VCSDefinition | undefined {
  return vcses.find(({ short: vcsShort }) => short === vcsShort);
}

export function mustGetVCSFromShort(short: string): VCSDefinition {
  const vcs = getVCSFromShort(short);

  if (vcs === undefined) {
    throw new UnhandledVCS(short);
  }
  return vcs;
}

export function isLegacyProject(projectSlug: string) {
  return ['gh', 'bb'].includes(projectSlug.split('/')[0]);
}
