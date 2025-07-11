import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

export const createSSETransport = (server: McpServer) => {
  const app = express();

  // GET /ping → simple health check
  app.get('/ping', (_req, res) => {
    res.json({
      result: 'pong',
    });
  });

  const transports: Record<string, SSEServerTransport> = {};
  app.get('/mcp', async (req, res) => {
    const transport = new SSEServerTransport('/invocations', res);
    transports[transport.sessionId] = transport;

    // Connect the server to the transport (this calls start() automatically)
    await server.connect(transport);
  });

  // POST /invocations → handle initialize + calls
  // @ts-expect-error - TypeScript inference issue with Express route handler
  app.post('/invocations', async (req, res) => {
    const sessionId =
      (req.header('mcp-session-id') as string) ||
      (req.query.sessionId as string);

    if (!sessionId || !transports[sessionId]) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid or missing MCP session ID' },
        id: req.body?.id || null,
      });
    }

    const transport = transports[sessionId];

    try {
      // handle the MCP request via transport
      await transport.handlePostMessage(req, res, req.body);
    } catch (error: any) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message,
          },
          id: req.body?.id || null,
        });
      }
    }
  });

  const port = 8080;
  app.listen(port, () => {
    console.log(`CircleCI MCP server listening on http://0.0.0.0:${port}`);
  });
};
