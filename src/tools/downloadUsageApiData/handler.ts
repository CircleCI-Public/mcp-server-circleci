import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { downloadUsageApiDataInputSchema } from './inputSchema.js';
import { getUsageApiData } from '../../lib/usage-api/getUsageApiData.js';
import { parseUserDate } from '../../lib/usage-api/parseUserDate.js';

export const downloadUsageApiData: ToolCallback<{ params: typeof downloadUsageApiDataInputSchema }> = async (args) => {
  const params = args.params || {};
  const parsed = downloadUsageApiDataInputSchema.parse(params);
  // Normalize dates using parseUserDate
  const normalizedStart = parseUserDate(parsed.startDate) || parsed.startDate;
  const normalizedEnd = parseUserDate(parsed.endDate) || parsed.endDate;
  // Debug log for troubleshooting jobId propagation
  console.error('DEBUG: handler received params', { ...parsed, startDate: normalizedStart, endDate: normalizedEnd });
  const { orgId, outputDir, jobId } = parsed;
  const result = await getUsageApiData({ orgId, startDate: normalizedStart, endDate: normalizedEnd, outputDir, jobId });
  return result;
}; 