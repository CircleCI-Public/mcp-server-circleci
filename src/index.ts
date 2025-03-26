#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CCI_HANDLERS, CCI_TOOLS, ToolHandler } from './tools.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
);

const server = new McpServer(
  {
    name: 'mcp-server-circleci',
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// Register tools
CCI_TOOLS.forEach((tool) => {
  const handler = CCI_HANDLERS[tool.name];
  if (!handler) {
    throw new Error(`Handler for tool ${tool.name} not found`);
  }

  server.tool(
    tool.name,
    tool.description,
    { params: tool.inputSchema },
    handler as ToolHandler<typeof tool.name>,
  );
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error('Server error:', error);
  process.exit(1);
});
