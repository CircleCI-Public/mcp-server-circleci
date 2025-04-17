const MAX_LENGTH = 10000;

export const SEPARATOR = '<<<MCP_OUTPUT_SEPARATOR>>>\n';

const outputTextTruncated = (outputText: string) => {
  if (outputText.length > MAX_LENGTH) {
    const truncationNotice =
      '<MCPTruncationWarning>⚠️ Output has been truncated due to length. Showing last entries up to size limit.</MCPTruncationWarning>\n\n';

    const entries = outputText.split(SEPARATOR);

    let truncatedText = truncationNotice;
    let currentLength = truncationNotice.length;

    // Process entries from the end
    for (let i = entries.length - 1; i >= 0; i--) {
      const entryWithSeparator = SEPARATOR + entries[i];
      if (currentLength + entryWithSeparator.length > MAX_LENGTH) {
        break;
      }
      truncatedText += entryWithSeparator;
      currentLength += entryWithSeparator.length;
    }

    return {
      content: [{ type: 'text' as const, text: truncatedText }],
    };
  }

  return {
    content: [{ type: 'text' as const, text: outputText }],
  };
};

export default outputTextTruncated;
