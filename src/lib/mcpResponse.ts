/**
 * Represents a basic text content block for MCP responses
 */
export type McpTextContent = {
  type: 'text';
  text: string;
};

/**
 * Type for MCP response content
 */
export type McpContent = McpTextContent;

/**
 * Type for representing a successful MCP response
 */
export type McpSuccessResponse = {
  content: McpContent[];
  isError?: false;
};

/**
 * Type for representing an error MCP response
 */
export type McpErrorResponse = {
  content: McpContent[];
  isError: true;
};

/**
 * Creates an error MCP response with text content
 * @param text The error text content to include in the response
 * @returns A properly formatted MCP error response
 */
export function createErrorResponse(text: string): McpErrorResponse {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}
