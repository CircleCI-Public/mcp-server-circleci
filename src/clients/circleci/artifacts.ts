import { z } from 'zod';
import { HTTPClient } from './httpClient.js';

// Schema for individual artifact
const artifactSchema = z.object({
  path: z.string().describe('The artifact file path'),
  pretty_path: z.string().describe('The pretty artifact file path').optional(),
  node_index: z.number().describe('The node that produced the artifact'),
  url: z.string().describe('Download URL for the artifact'),
});

export type Artifact = z.infer<typeof artifactSchema>;

// Schema for artifacts response
const artifactsResponseSchema = z.object({
  items: z.array(artifactSchema),
  next_page_token: z.string().nullable().optional(),
});

export type ArtifactsResponse = z.infer<typeof artifactsResponseSchema>;

export class ArtifactsAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Get all artifacts for a job
   * @param projectSlug The project slug
   * @param jobNumber The job number
   * @returns All artifacts from the job
   */
  async getAllJobArtifacts(
    projectSlug: string,
    jobNumber: number,
  ): Promise<Artifact[]> {
    const allArtifacts: Artifact[] = [];
    let nextPageToken: string | null = null;

    do {
      const params: Record<string, any> = {};
      if (nextPageToken) {
        params['page-token'] = nextPageToken;
      }

      const response = await this.client.get<ArtifactsResponse>(
        `/project/${projectSlug}/${jobNumber}/artifacts`,
        params,
      );

      const validatedResponse = artifactsResponseSchema.parse(response);
      allArtifacts.push(...validatedResponse.items);
      nextPageToken = validatedResponse.next_page_token || null;
    } while (nextPageToken);

    return allArtifacts;
  }
}
