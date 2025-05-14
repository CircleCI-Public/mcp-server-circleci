import { describe, it, expect } from 'vitest';
import { rerunWorkflowFromFailed } from './handler.js';

describe('rerunWorkflowFromFailed', () => {
  it('should return the message provided by the user', async () => {
    const controller = new AbortController();
    const result = await rerunWorkflowFromFailed(
      {
        params: {
          message: 'Hello, world!',
        },
      },
      {
        signal: controller.signal,
      }
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Received message: Hello, world!',
        },
      ],
    });
  });
});
