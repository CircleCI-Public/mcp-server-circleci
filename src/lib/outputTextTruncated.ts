import { McpSuccessResponse } from './mcpResponse.js';

const MAX_LENGTH = 50000;

export const SEPARATOR = '\n<<<SEPARATOR>>>\n';

/**
 * Creates an MCP response with potentially truncated text
 * @param outputText The full text that might need to be truncated
 * @returns An MCP response containing the original or truncated text
 */
const outputTextTruncated = (outputText: string): McpSuccessResponse => {
  if (outputText.length > MAX_LENGTH) {
    const truncationNotice = `<MCPTruncationWarning>
⚠️ TRUNCATED OUTPUT WARNING ⚠️
- Showing only most recent entries
</MCPTruncationWarning>\n\n`;

    // Take the tail of the output text
    const truncatedText =
      truncationNotice +
      outputText.slice(-MAX_LENGTH + truncationNotice.length);

    return {
      content: [{ type: 'text' as const, text: truncatedText }],
    };
  }

  return {
    content: [{ type: 'text' as const, text: outputText }],
  };
};

export default outputTextTruncated;
