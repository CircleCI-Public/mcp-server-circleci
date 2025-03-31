// import { CircleCIClients } from './clients/circleci/index.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getBuildFailureLogsTool } from './tools/getBuildFailureLogs.js';
import { getBuildFailureLogs } from './handlers/getBuildFailureLogs.js';

// Define the tools with their configurations
export const CCI_TOOLS = [getBuildFailureLogsTool];

// Extract the tool names as a union type
type CCIToolName = (typeof CCI_TOOLS)[number]['name'];

export type ToolHandler<T extends CCIToolName> = ToolCallback<{
  params: Extract<(typeof CCI_TOOLS)[number], { name: T }>['inputSchema'];
}>;

// Create a type for the tool handlers that directly maps each tool to its appropriate input schema
type ToolHandlers = {
  [K in CCIToolName]: ToolHandler<K>;
};

// const circleci = new CircleCIClients(process.env.CIRCLECI_TOKEN ?? '');

export const CCI_HANDLERS = {
  get_build_failure_logs: getBuildFailureLogs,
} satisfies ToolHandlers;
