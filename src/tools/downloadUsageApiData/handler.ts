import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { downloadUsageApiDataInputSchema } from './inputSchema.js';
import { getUsageApiData } from '../../lib/usage-api/getUsageApiData.js';
import { parseUserDate } from '../../lib/usage-api/parseUserDate.js';

// Add date-fns for date difference calculation
import { differenceInCalendarDays, parseISO } from 'date-fns';

export const downloadUsageApiData: ToolCallback<{ params: typeof downloadUsageApiDataInputSchema }> = async (args) => {
  const params = args.params || {};
  const parsed = downloadUsageApiDataInputSchema.parse(params);
  // Normalize dates using parseUserDate
  const normalizedStart = parseUserDate(parsed.startDate) || parsed.startDate;
  const normalizedEnd = parseUserDate(parsed.endDate) || parsed.endDate;
  // Validate date range does not exceed 32 days
  try {
    const start = parseISO(normalizedStart);
    const end = parseISO(normalizedEnd);
    const days = differenceInCalendarDays(end, start) + 1; // inclusive
    if (days > 32) {
      return {
        content: [
          { type: 'text', text: `ERROR: The maximum allowed date range for the usage API is 32 days. You requested ${days} days. Please reduce your date range or split your request into multiple 32-day chunks.` }
        ]
      };
    }
    if (days < 1) {
      return {
        content: [
          { type: 'text', text: `ERROR: The end date must be after or equal to the start date.` }
        ]
      };
    }
  } catch (e) {
    return {
      content: [
        { type: 'text', text: `ERROR: Invalid date format. Please use YYYY-MM-DD or a recognizable date string.` }
      ]
    };
  }
  // Debug log for troubleshooting jobId propagation
  console.error('DEBUG: handler received params', { ...parsed, startDate: normalizedStart, endDate: normalizedEnd });
  const { orgId, outputDir, jobId } = parsed;
  const result = await getUsageApiData({ orgId, startDate: normalizedStart, endDate: normalizedEnd, outputDir, jobId });
  return result;
}; 