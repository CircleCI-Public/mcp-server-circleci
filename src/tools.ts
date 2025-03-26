import { nodeVersionInputSchema } from './toolsSchema.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

// Define the tools with their configurations
export const CCI_TOOLS = [
  {
    name: '__node_version' as const,
    description: `Get the Node.js version used by the MCP server`,
    inputSchema: nodeVersionInputSchema,
  },
];

// Extract the tool names as a union type
type CCIToolName = (typeof CCI_TOOLS)[number]['name'];

export type ToolHandler<T extends CCIToolName> = ToolCallback<{
  params: Extract<(typeof CCI_TOOLS)[number], { name: T }>['inputSchema'];
}>;

// Create a type for the tool handlers that directly maps each tool to its appropriate input schema
type ToolHandlers = {
  [K in CCIToolName]: ToolHandler<K>;
};

export const CCI_HANDLERS = {
  // for debugging reasons.
  __node_version: () => ({
    content: [{ type: 'text', text: process.version }],
  }),
} satisfies ToolHandlers;
