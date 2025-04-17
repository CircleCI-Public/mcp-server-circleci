const MAX_LENGTH = 100000;

export const SEPARATOR = '<<<MCP_OUTPUT_SEPARATOR>>>\n';

const outputTextTruncated = (outputText: string) => {
  if (outputText.length > MAX_LENGTH) {
    const truncationNotice = `<MCPTruncationWarning>
⚠️ TRUNCATED OUTPUT WARNING ⚠️
- Original length: ${outputText.length} characters
- Showing only most recent entries
</MCPTruncationWarning>\n\n`;

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
