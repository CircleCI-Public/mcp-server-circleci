#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { CCI_HANDLERS, CCI_TOOLS } from './circleci-tools.js';
import { createUnifiedTransport } from './transports/unified.js';
import { createStdioTransport } from './transports/stdio.js';

const server = new McpServer(
  { name: 'mcp-server-circleci', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } },
);

// ---- DEBUG WRAPPERS --------------------------------------------------
if (process.env.debug === 'true') {
  const srv: any = server;

  if (typeof srv.notification === 'function') {
    const origNotify = srv.notification.bind(server);
    srv.notification = async (...args: any[]) => {
      try {
        const [{ method, params }] = args;
        console.log(
          '[DEBUG] outgoing notification:',
          method,
          JSON.stringify(params),
        );
      } catch {
        /* ignore */
      }
      return origNotify(...args);
    };
  }

  if (typeof srv.request === 'function') {
    const origRequest = srv.request.bind(server);
    srv.request = async (...args: any[]) => {
      const [payload] = args;
      const result = await origRequest(...args);
      console.log(
        '[DEBUG] response to',
        payload?.method,
        JSON.stringify(result).slice(0, 200),
      );
      return result;
    };
  }
}

// Register all CircleCI tools once
if (process.env.debug === 'true') {
  console.log('[DEBUG] [Startup] Registering CircleCI MCP tools...');
}
// Ensure we advertise support for tools/list in capabilities (SDK only sets listChanged)
(server as any).server.registerCapabilities({ tools: { list: true } });

CCI_TOOLS.forEach((tool) => {
  const handler = CCI_HANDLERS[tool.name];
  if (!handler) throw new Error(`Handler for tool ${tool.name} not found`);
  if (process.env.debug === 'true') {
    console.log(`[DEBUG] [Startup] Registering tool: ${tool.name}`);
  }
  server.tool(
    tool.name,
    tool.description,
    { params: tool.inputSchema.optional() },
    handler as any,
  );
});

async function main() {
  if (process.env.start === 'remote') {
    console.log('Starting CircleCI MCP unified HTTP+SSE server...');
    createUnifiedTransport(server);
  } else {
    console.log('Starting CircleCI MCP server in stdio mode...');
    createStdioTransport(server);
  }
}

main().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
