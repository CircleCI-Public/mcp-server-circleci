import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { findUnderusedResourceClassesInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { findUnderusedResourceClassesFromCSV } from '../../lib/usage-api/findUnderusedResourceClasses.js';

export const findUnderusedResourceClasses: ToolCallback<{ params: typeof findUnderusedResourceClassesInputSchema }> = async (args) => {
  const params = args.params || {};
  const { csvFilePath, threshold = 40 } = params;
  if (!csvFilePath) {
    return mcpErrorOutput('ERROR: csvFilePath is required.');
  }
  try {
    const { report } = await findUnderusedResourceClassesFromCSV({ csvFilePath, threshold });
    return {
      content: [
        { type: 'text', text: report },
      ],
    };
  } catch (e: any) {
    return mcpErrorOutput(`ERROR: ${e && e.message ? e.message : e}`);
  }
}; 