import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configHelper } from './handler.js';
import * as client from '../../clients/client.js';

// Mock dependencies
vi.mock('../../clients/client.js');

describe('configHelper handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a valid MCP success response when config is valid', async () => {
    const mockCircleCIClient = {
      configValidate: {
        validateConfig: vi.fn().mockResolvedValue({ valid: true }),
      },
    };

    vi.spyOn(client, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );

    const args = {
      params: {
        configFile:
          'version: 2.1\njobs:\n  build:\n    docker:\n      - image: cimg/node:16.0',
      },
    } as any;

    const controller = new AbortController();
    const response = await configHelper(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should return a valid MCP success response (with error info) when config is invalid', async () => {
    const mockCircleCIClient = {
      configValidate: {
        validateConfig: vi.fn().mockResolvedValue({
          valid: false,
          errors: [{ message: 'Invalid config' }],
        }),
      },
    };

    vi.spyOn(client, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );

    const args = {
      params: {
        configFile: 'invalid yaml',
      },
    } as any;

    const controller = new AbortController();
    const response = await configHelper(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Invalid config');
  });
});
