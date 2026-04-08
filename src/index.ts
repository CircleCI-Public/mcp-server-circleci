#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { CCI_HANDLERS, CCI_TOOLS } from './circleci-tools.js';
import { createUnifiedTransport } from './transports/unified.js';
import { createStdioTransport } from './transports/stdio.js';
import {
  initializeMetrics,
  shutdownMetrics,
  ToolHandler,
  wrapToolHandler,
} from './lib/telemetry/index.js';

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
        console.error(
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
      console.error(
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
  console.error('[DEBUG] [Startup] Registering CircleCI MCP tools...');
}
CCI_TOOLS.forEach((tool) => {
  const handler = CCI_HANDLERS[tool.name];
  if (!handler) throw new Error(`Handler for tool ${tool.name} not found`);
  if (process.env.debug === 'true') {
    console.error(`[DEBUG] [Startup] Registering tool: ${tool.name}`);
  }

  // Wrap handler with telemetry instrumentation
  const wrappedHandler = wrapToolHandler(tool.name, handler as ToolHandler);

  server.tool(
    tool.name,
    tool.description,
    { params: tool.inputSchema.optional() },
    wrappedHandler,
  );
});

async function main() {
  // Initialize OpenTelemetry metrics
  await initializeMetrics();

  // Handle graceful shutdown
  const shutdown = async () => {
    if (process.env.debug === 'true') {
      console.error('[DEBUG] [Shutdown] Shutting down server...');
    }
    await shutdownMetrics();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  if (process.env.start === 'remote') {
    console.error('Starting CircleCI MCP unified HTTP+SSE server...');
    createUnifiedTransport(server);
  } else {
    console.error('Starting CircleCI MCP server in stdio mode...');
    createStdioTransport(server);
  }
}

main().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
