import express from 'express';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CCI_HANDLERS, CCI_TOOLS } from '../circleci-tools.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Augment the express request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// Enhanced debugging middleware
const createDebugMiddleware = () => {
  return (req: Request, res: Response, next: any) => {
    if (process.env.debug === 'true') {
      const timestamp = new Date().toISOString();
      const requestId = Math.random().toString(36).substring(7);
      
      console.log(`\n[DEBUG] [${timestamp}] [REQ-${requestId}] ======== INCOMING REQUEST ========`);
      console.log(`[DEBUG] [REQ-${requestId}] Method: ${req.method}`);
      console.log(`[DEBUG] [REQ-${requestId}] URL: ${req.url}`);
      console.log(`[DEBUG] [REQ-${requestId}] Headers:`, req.headers);
      console.log(`[DEBUG] [REQ-${requestId}] Body:`, req.body);
      
      // Add request ID to req for tracking
      req.requestId = requestId;
      
      // Capture response body for logging
      const chunks: any[] = [];
      const originalWrite = res.write;
      const originalEnd = res.end;

      res.write = function(chunk: any, ...args: any[]) {
        chunks.push(Buffer.from(chunk));
        return (originalWrite as Function).apply(res, [chunk, ...args]);
      };

      res.end = function(chunk?: any, ...args: any[]) {
        if (chunk) {
          chunks.push(Buffer.from(chunk));
        }
        return (originalEnd as Function).apply(res, [chunk, ...args]);
      };
      
      // Log response when it's finished
      res.on('finish', () => {
        if (process.env.debug === 'true') {
          const body = Buffer.concat(chunks).toString('utf8');
          console.log(`[DEBUG] [REQ-${req.requestId}] ======== RESPONSE SENT ========`);
          console.log(`[DEBUG] [REQ-${req.requestId}] Status: ${res.statusCode}`);
          console.log(`[DEBUG] [REQ-${req.requestId}] Headers:`, res.getHeaders());
          console.log(`[DEBUG] [REQ-${req.requestId}] Body:`, body);
        }
      });
    }
    next();
  };
};

/**
 * Stateless MCP transport using StreamableHTTPServerTransport
 * In stateless mode, we create a new transport and server instance for each request
 * to ensure complete isolation. No session management or SSE streams.
 */
/**
 * Creates a new McpServer instance, configured with CircleCI tools.
 * This factory is used to create a fresh server for each request in stateless mode.
 */
const getServer = () => {
  const server = new McpServer(
    { name: 'mcp-server-circleci', version: '1.0.0' },
    // Disable client-side namespacing for tool names
    { capabilities: { namespace: false, tools: {}, resources: {} } },
  );

  // Ensure we advertise support for tools/list in capabilities
  (server as any).server.registerCapabilities({ tools: { list: true } });

  // Register all CircleCI tools
  CCI_TOOLS.forEach((tool) => {
    const handler = CCI_HANDLERS[tool.name as keyof typeof CCI_HANDLERS];
    if (!handler) {
      console.error(`[ERROR] Handler not found for tool: ${tool.name}`);
      throw new Error(`Handler for tool ${tool.name} not found`);
    }
    server.tool(
      tool.name,
      tool.description,
      { params: tool.inputSchema.optional() },
      handler as any,
    );
  });

  return server;
};

/**
 * Stateless MCP transport using StreamableHTTPServerTransport
 * In stateless mode, we create a new transport and server instance for each request
 * to ensure complete isolation. No session management or SSE streams.
 */
export const createUnifiedTransport = async () => {
  const app = express();
  
  // Parse JSON bodies first, so it's available in the debugger
  app.use(express.json());

  // Add debugging middleware
  app.use(createDebugMiddleware());

  // Health check - AgentCore compatible (supports GET and POST)
  const handlePing = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      status: 'Healthy',
      time_of_last_update: Math.floor(Date.now() / 1000)
    });
    
    if (process.env.debug === 'true') {
      console.log(`[DEBUG] [PING] Health check responded for ${req.method} /ping`);
    }
  };

  app.get('/ping', handlePing);
  app.post('/ping', handlePing);

  // POST /mcp - Handle JSON-RPC requests in stateless mode
  app.post('/mcp', async (req: Request, res: Response) => {
    // Handle Bedrock AgentCore's JSON-RPC ping before it hits the main MCP handler
    if (req.body && req.body.method === 'ping') {
      if (process.env.debug === 'true') {
        console.log(`[DEBUG] [PING] Handled JSON-RPC ping`);
      }
      return res.status(200).json({
        jsonrpc: '2.0',
        result: { status: 'Healthy' , time_of_last_update: Math.floor(Date.now() / 1000)},
        id: req.body.id,
      });
    }

    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.
    try {
      const server = getServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on('close', () => {
        if (process.env.debug === 'true') {
          console.log('Request closed');
        }
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // GET /mcp - SSE notifications not supported in stateless mode
  app.get('/mcp', async (req: Request, res: Response) => {
    if (process.env.debug === 'true') {
      console.log('Received GET MCP request');
    }
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });

  // DELETE /mcp - Session termination not needed in stateless mode
  app.delete('/mcp', async (req: Request, res: Response) => {
    if (process.env.debug === 'true') {
      console.log('Received DELETE MCP request');
    }
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });

  const port = process.env.port || 8000;
  app.listen(port, () => {
    console.log(`CircleCI MCP server listening on http://0.0.0.0:${port}`);
    
    if (process.env.debug === 'true') {
      console.log('\n[DEBUG] ======== DEBUG MODE ENABLED ========');
      console.log('[DEBUG] MCP Server using StreamableHTTPServerTransport');
      console.log('[DEBUG] Endpoints:');
      console.log(`[DEBUG]   GET  /ping - Health check`);
      console.log(`[DEBUG]   POST /mcp  - JSON-RPC requests`);
      console.log(`[DEBUG]   GET  /mcp  - SSE stream (if supported by client)`);
      console.log(`[DEBUG]   DELETE /mcp - Close session`);
      console.log('[DEBUG] =====================================\n');
    }
  });
};