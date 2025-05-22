import { describe, it, expect } from 'vitest';
import { run-evaluation-tests } from './handler.js';

describe('run-evaluation-tests', () => {
  it('should return the message provided by the user', async () => {
    const controller = new AbortController();
    const result = await run-evaluation-tests(
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
