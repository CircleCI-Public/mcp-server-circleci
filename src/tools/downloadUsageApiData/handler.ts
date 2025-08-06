import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { downloadUsageApiDataInputSchema } from './inputSchema.js';
import { getUsageApiData } from '../../lib/usage-api/getUsageApiData.js';
import { parseDateTimeString } from '../../lib/usage-api/parseDateTimeString.js';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const downloadUsageApiData: ToolCallback<{ params: typeof downloadUsageApiDataInputSchema }> = async (args) => {
  const { CIRCLECI_BASE_URL } = process.env;
  if (CIRCLECI_BASE_URL && CIRCLECI_BASE_URL !== 'https://circleci.com') {
    return mcpErrorOutput('ERROR: The Usage API is not available on CircleCI server installations. This tool is only available for CircleCI cloud users.');
  }

  const params = args.params || {};
  const parsed = downloadUsageApiDataInputSchema.parse(params);

  const startDate = parseDateTimeString(parsed.startDate, { defaultTime: 'start-of-day' });
  const endDate = parseDateTimeString(parsed.endDate, { defaultTime: 'end-of-day' });

  try {
    const start = parseISO(startDate!);
    const end = parseISO(endDate!);

    const days = differenceInCalendarDays(end, start) + 1;
    if (days > 32) {
      return mcpErrorOutput(`ERROR: The maximum allowed date range for the usage API is 32 days.`);
    }
    if (days < 1) {
      return mcpErrorOutput('ERROR: The end date must be after or equal to the start date.');
    }
    
    console.error('DEBUG: handler received params', { ...parsed, startDate, endDate });
    const { orgId, outputDir, jobId } = parsed;
    return await getUsageApiData({ orgId, startDate: startDate!, endDate: endDate!, outputDir, jobId });

  } catch {
    return mcpErrorOutput('ERROR: Invalid date format. Please use YYYY-MM-DD or a recognizable date string.');
  }
}; 