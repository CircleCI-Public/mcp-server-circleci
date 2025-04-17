const MAX_LENGTH = 50000;

export const SEPARATOR = '\n<<<SEPARATOR>>>\n';

const outputTextTruncated = (outputText: string) => {
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
