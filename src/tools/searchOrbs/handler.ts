import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchOrbsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

const NO_RESULTS = (q: string) =>
  `No certified orbs match "${q}". The CircleCI registry has thousands of community orbs that are not indexed for text search — if you know the exact name of a community orb (e.g., "datadog/agent"), call get_orb_details directly with that slug.`;

export const searchOrbs: ToolCallback<{
  params: typeof searchOrbsInputSchema;
}> = async (args) => {
  const { query } = args.params ?? {};

  if (!query || typeof query !== 'string') {
    return mcpErrorOutput(
      'Missing required input: query. Provide a keyword to search for (e.g., "slack").',
    );
  }

  const circleci = getCircleCIClient();

  let results;
  try {
    results = await circleci.orbs.searchOrbs({ query });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return mcpErrorOutput(msg);
  }

  if (results.length === 0) {
    return {
      content: [{ type: 'text', text: NO_RESULTS(query) }],
    };
  }

  const lines = results.map((r) => {
    const versionPart = r.version ? `@${r.version}` : ' (no published versions)';
    const popularityPart =
      r.popularity > 0
        ? ` — ${r.popularity.toLocaleString()} builds in last 30 days`
        : '';
    return `- \`${r.name}${versionPart}\` (certified)${popularityPart}`;
  });

  const text = `Found ${results.length} matching certified orb${results.length === 1 ? '' : 's'} for "${query}":\n\n${lines.join('\n')}\n\nUse get_orb_details with one of these slugs to retrieve the full schema (commands, jobs, executors, parameters).`;

  return { content: [{ type: 'text', text }] };
};
