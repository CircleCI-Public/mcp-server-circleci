import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getOrbDetailsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import outputTextTruncated from '../../lib/outputTextTruncated.js';
import {
  parseOrbSource,
  OrbSourceParseError,
} from '../../lib/orb-schema/parseOrbSource.js';
import { formatOrbDetails } from '../../lib/orb-schema/formatOrbDetails.js';

export const getOrbDetails: ToolCallback<{
  params: typeof getOrbDetailsInputSchema;
}> = async (args) => {
  const { orbSlug } = args.params ?? {};

  if (!orbSlug || typeof orbSlug !== 'string') {
    return mcpErrorOutput(
      'Missing required input: orbSlug. Provide a slug like "circleci/slack" or "circleci/slack@4.12.6".',
    );
  }

  const circleci = getCircleCIClient();

  let orb;
  try {
    orb = await circleci.orbs.getOrb({ orbSlug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return mcpErrorOutput(msg);
  }

  let schema;
  try {
    schema = parseOrbSource(orb.source);
  } catch (e) {
    if (e instanceof OrbSourceParseError) {
      return mcpErrorOutput(
        `Orb '${orb.orbName}' was found (version ${orb.version}) but its source YAML could not be parsed: ${e.message}. You can still pin this version in config (\`${orb.orbName}@${orb.version}\`), but parameter details are unavailable.`,
      );
    }
    throw e;
  }

  const formatted = formatOrbDetails({
    orbName: orb.orbName,
    version: orb.version,
    schema,
  });

  return outputTextTruncated(formatted);
};
