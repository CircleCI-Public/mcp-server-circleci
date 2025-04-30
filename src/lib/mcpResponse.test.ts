import { describe, it, expect } from 'vitest';
import { createErrorResponse } from './mcpResponse.js';

describe('MCP Response Utilities', () => {
  describe('createErrorResponse', () => {
    it('should create a valid error response', () => {
      const text = 'Error message';
      const response = createErrorResponse(text);

      expect(response).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text,
          },
        ],
      });
    });
  });
});
