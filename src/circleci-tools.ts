// import { CircleCIClients } from './clients/circleci/index.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getBuildLogsTool,
  getBuildLogsToolFunction,
} from './utils/getBuildLogs.js';
import { getBuildFailureLogsTool } from './tools/getBuildFailureLogs/tool.js'; // temporary
import { getBuildFailureLogs } from './tools/getBuildFailureLogs/handler.js';

// Define the tools with their configurations
export const CCI_TOOLS = [getBuildFailureLogsTool, getBuildLogsTool];

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
  get_build_logs: getBuildLogsToolFunction, // temporary
} satisfies ToolHandlers;
