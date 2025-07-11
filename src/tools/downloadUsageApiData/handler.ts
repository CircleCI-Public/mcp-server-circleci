import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { downloadUsageApiDataInputSchema } from './inputSchema.js';
import { getUsageApiData } from '../../lib/usage-api/getUsageApiData.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const downloadUsageApiData: ToolCallback<{ params: typeof downloadUsageApiDataInputSchema }> = async (args) => {
  const params = args.params || {};
  // Debug log for troubleshooting jobId propagation
  console.error('DEBUG: handler received params', params);
  const { orgId, startDate, endDate, outputDir, jobId } = params;
  // orgId, startDate, endDate, and outputDir are all enforced by schema validation
  if (!orgId || !startDate || !endDate || !outputDir) {
    return mcpErrorOutput('SIMPLE ERROR: Missing required parameters: orgId, startDate, endDate, outputDir.');
  }
  const result = await getUsageApiData({ orgId, startDate, endDate, outputDir, jobId });
  // Flatten the content array into a single string if needed
  if (result && result.content && Array.isArray(result.content)) {
    const allText = result.content.map((c: any) => c.text).join('\n\n');
    return { ...result, content: [{ type: 'text', text: allText }] };
  }
  return result;
}; 