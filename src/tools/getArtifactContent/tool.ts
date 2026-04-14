import { getArtifactContentInputSchema } from './inputSchema.js';

export const getArtifactContentTool = {
  name: 'get_artifact_content' as const,
  description: `
    Fetches the content of a CircleCI artifact by URL.

    Use this after list_artifacts to read the actual content of an artifact
    (e.g., test reports, logs, binaries, coverage reports).

    The artifact URL must be obtained from the list_artifacts tool output.
    Authentication is handled automatically using the configured CIRCLECI_TOKEN.
    `,
  inputSchema: getArtifactContentInputSchema,
};
