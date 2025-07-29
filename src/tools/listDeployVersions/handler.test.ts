import { describe, it, expect } from 'vitest';
import { listDeployVersions } from './handler.js';

describe('listDeployVersions', () => {
  it('should return the message provided by the user', async () => {
    const controller = new AbortController();
    const result = await listDeployVersions(
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
