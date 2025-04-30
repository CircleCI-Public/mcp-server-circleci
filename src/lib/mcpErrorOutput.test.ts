import { describe, it, expect } from 'vitest';
import mcpErrorOutput from './mcpErrorOutput.js';

describe('mcpErrorOutput', () => {
  it('should create an error response with the provided text', () => {
    const errorMessage = 'Test error message';
    const result = mcpErrorOutput(errorMessage);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
    });
  });

  it('should maintain the exact error text provided', () => {
    const complexErrorMessage = `
      Error occurred:
      - Missing parameter: projectSlug
      - Invalid token format
    `;
    const result = mcpErrorOutput(complexErrorMessage);

    expect(result.content[0].text).toBe(complexErrorMessage);
  });
});
