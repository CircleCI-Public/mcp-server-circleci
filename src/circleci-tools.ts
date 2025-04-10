import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getBuildFailureLogsTool } from './tools/getBuildFailureLogs/tool.js';
import { getBuildFailureLogs } from './tools/getBuildFailureLogs/handler.js';
import { getFlakyTestLogsTool } from './tools/getFlakyTests/tool.js';
import { getFlakyTestLogs } from './tools/getFlakyTests/handler.js';

// Define the tools with their configurations
export const CCI_TOOLS = [getBuildFailureLogsTool, getFlakyTestLogsTool];

// Extract the tool names as a union type
type CCIToolName = (typeof CCI_TOOLS)[number]['name'];

export type ToolHandler<T extends CCIToolName> = ToolCallback<{
  params: Extract<(typeof CCI_TOOLS)[number], { name: T }>['inputSchema'];
}>;

// Create a type for the tool handlers that directly maps each tool to its appropriate input schema
type ToolHandlers = {
  [K in CCIToolName]: ToolHandler<K>;
};

// Higher-order function to wrap handlers with error handling
// Ensures any thrown errors are handled in an MCP friendly manner
const withErrorHandling = <T extends CCIToolName>(
  handler: ToolHandler<T>,
): ToolHandler<T> => {
  return async (args, server) => {
    try {
      return await handler(args, server);
    } catch (error) {
      console.error('Tool execution failed:', error);

      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error executing tool: ${error instanceof Error ? error.message : 'An unknown error occurred'}. Please check your inputs and try again.`,
          },
        ],
      };
    }
  };
};

export const CCI_HANDLERS = {
  get_build_failure_logs: withErrorHandling(getBuildFailureLogs),
  find_flaky_tests: withErrorHandling(getFlakyTestLogs),
} satisfies ToolHandlers;
