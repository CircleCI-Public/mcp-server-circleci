import { GraphQLClient } from './graphqlClient.js';

export type OrbVersionDetails = {
  orbName: string;
  version: string;
  createdAt: string;
  source: string;
};

export type OrbSearchResult = {
  name: string;
  version: string | null;
  popularity: number;
};

type GetOrbVersionResponse = {
  orbVersion: {
    version: string;
    createdAt: string;
    source: string;
  } | null;
};

type GetOrbLatestResponse = {
  orb: {
    name: string;
    versions: { version: string; createdAt: string; source: string }[];
  } | null;
};

type ListVersionsResponse = {
  orb: {
    versions: { version: string }[];
  } | null;
};

type SearchOrbsResponse = {
  orbs: {
    edges: {
      node: {
        name: string;
        versions: { version: string }[];
        statistics: { last30DaysBuildCount: number | null } | null;
      };
    }[];
  };
};

export class OrbsAPI {
  protected client: GraphQLClient;

  constructor(graphqlClient: GraphQLClient) {
    this.client = graphqlClient;
  }

  async getOrb({
    orbSlug,
  }: {
    orbSlug: string;
  }): Promise<OrbVersionDetails> {
    const slashCount = (orbSlug.match(/\//g) ?? []).length;
    if (slashCount !== 1) {
      throw new Error(
        `Invalid orb slug '${orbSlug}': expected format 'namespace/name' or 'namespace/name@version'.`,
      );
    }

    const [nameWithoutVersion, requestedVersion] = orbSlug.split('@');

    if (requestedVersion) {
      const result = await this.client.query<GetOrbVersionResponse>(
        `query GetOrbVersion($ref: String!) {
          orbVersion(orbVersionRef: $ref) {
            version
            createdAt
            source
          }
        }`,
        { ref: orbSlug },
      );

      if (result.orbVersion) {
        return {
          orbName: nameWithoutVersion,
          version: result.orbVersion.version,
          createdAt: result.orbVersion.createdAt,
          source: result.orbVersion.source,
        };
      }

      const versions = await this.client.query<ListVersionsResponse>(
        `query ListVersions($name: String!) {
          orb(name: $name) {
            versions(count: 20) { version }
          }
        }`,
        { name: nameWithoutVersion },
      );

      if (!versions.orb) {
        throw new Error(`Orb '${nameWithoutVersion}' not found.`);
      }

      const available = versions.orb.versions.map((v) => v.version);
      throw new Error(
        `Version '${requestedVersion}' not found for orb '${nameWithoutVersion}'. ` +
          `Recent available versions: ${available.slice(0, 10).join(', ') || '(none)'}.`,
      );
    }

    const latest = await this.client.query<GetOrbLatestResponse>(
      `query GetOrbLatest($name: String!) {
        orb(name: $name) {
          name
          versions(count: 1) {
            version
            createdAt
            source
          }
        }
      }`,
      { name: nameWithoutVersion },
    );

    if (!latest.orb) {
      throw new Error(`Orb '${nameWithoutVersion}' not found.`);
    }

    if (latest.orb.versions.length === 0) {
      throw new Error(`Orb '${nameWithoutVersion}' has no published versions.`);
    }

    const v = latest.orb.versions[0];
    return {
      orbName: latest.orb.name,
      version: v.version,
      createdAt: v.createdAt,
      source: v.source,
    };
  }

  async searchOrbs({ query }: { query: string }): Promise<OrbSearchResult[]> {
    const result = await this.client.query<SearchOrbsResponse>(
      `query SearchCertifiedOrbs {
        orbs(first: 100, certifiedOnly: true) {
          edges {
            node {
              name
              versions(count: 1) { version }
              statistics { last30DaysBuildCount }
            }
          }
        }
      }`,
    );

    const needle = query.toLowerCase();
    const matches = result.orbs.edges
      .map((e) => e.node)
      .filter((n) => n.name.toLowerCase().includes(needle))
      .map((n) => ({
        name: n.name,
        version: n.versions[0]?.version ?? null,
        popularity: n.statistics?.last30DaysBuildCount ?? 0,
      }));

    matches.sort((a, b) => b.popularity - a.popularity);
    return matches;
  }
}
