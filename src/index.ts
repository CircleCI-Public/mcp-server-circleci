#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CCI_HANDLERS, CCI_TOOLS, ToolHandler } from './circleci-tools.js';
import { createSSETransport } from './transports/sse.js';
import { createStdioTransport } from './transports/stdio.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
);

const server = new McpServer(
  { name: 'mcp-server-circleci', version: packageJson.version },
  { capabilities: { tools: {}, resources: {} } },
);

// Register CircleCI tools
CCI_TOOLS.forEach((tool) => {
  const handler = CCI_HANDLERS[tool.name];
  if (!handler) throw new Error(`Handler for tool ${tool.name} not found`);
  server.tool(
    tool.name,
    tool.description,
    { params: tool.inputSchema },
    handler as ToolHandler<typeof tool.name>,
  );
});

async function main() {
  // Parse command line arguments for transport type
  const args = process.argv;
  const transportArg = args[2];
  const transportType = transportArg ? transportArg : 'stdio'; // default to stdio

  console.log(`Starting CircleCI MCP server with ${transportType} transport`);

  if (transportType === 'start:sse') {
    createSSETransport(server);
  } else if (transportType === 'stdio') {
    createStdioTransport(server);
  } else {
    throw new Error(`Invalid transport type: ${transportType}`);
  }
}

main().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
