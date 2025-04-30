import { describe, it, expect } from 'vitest';
import outputTextTruncated from './outputTextTruncated';

describe('outputTextTruncated', () => {
  it('should return the original text when under max length', () => {
    const shortText = 'This is a short text';
    const result = outputTextTruncated(shortText);

    expect(result).toEqual({
      content: [{ type: 'text', text: shortText }],
    });
  });

  it('should truncate text when over max length', () => {
    const longText = 'a'.repeat(60000);
    const result = outputTextTruncated(longText);

    expect(result.content[0].text).toContain('<MCPTruncationWarning>');
    expect(result.content[0].text).toContain('TRUNCATED OUTPUT WARNING');

    expect(result.content[0].text.length).toBeLessThan(longText.length);

    const truncationNoticeLength = result.content[0].text.indexOf('\n\n') + 2;
    const truncatedContent = result.content[0].text.slice(
      truncationNoticeLength,
    );
    expect(longText.endsWith(truncatedContent)).toBe(true);
  });
});
