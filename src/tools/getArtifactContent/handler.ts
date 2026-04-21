import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getArtifactContentInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import outputTextTruncated from '../../lib/outputTextTruncated.js';

export const getArtifactContent: ToolCallback<{
  params: typeof getArtifactContentInputSchema;
}> = async (args) => {
  const { artifactURL } = args.params ?? {};

  if (!artifactURL) {
    return mcpErrorOutput('artifactURL is required.');
  }

  const token = process.env.CIRCLECI_TOKEN;
  if (!token) {
    return mcpErrorOutput('CIRCLECI_TOKEN is not set.');
  }

  let response: Response;
  try {
    response = await fetch(artifactURL, {
      headers: {
        'Circle-Token': token,
      },
    });
  } catch (error) {
    return mcpErrorOutput(
      `Failed to fetch artifact: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    return mcpErrorOutput(
      `Failed to fetch artifact: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isBinary =
    !contentType.startsWith('text/') &&
    !contentType.includes('json') &&
    !contentType.includes('xml') &&
    !contentType.includes('javascript') &&
    !contentType.includes('yaml') &&
    !contentType.includes('html');

  if (isBinary) {
    return mcpErrorOutput(
      `Artifact is a binary file (content-type: ${contentType}). Only text artifacts can be read directly.`,
    );
  }

  const content = await response.text();
  return outputTextTruncated(content);
};
