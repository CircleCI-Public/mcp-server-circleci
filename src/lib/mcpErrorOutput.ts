import { createErrorResponse, McpErrorResponse } from './mcpResponse.js';

/**
 * Creates an MCP error response with the provided text
 * @param text The error message text
 * @returns A properly formatted MCP error response
 */
export default function mcpErrorOutput(text: string): McpErrorResponse {
  return createErrorResponse(text);
}
