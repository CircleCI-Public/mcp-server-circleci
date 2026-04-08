import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as metrics from './metrics.js';
import { wrapToolHandler } from './wrapToolHandler.js';

vi.mock('./metrics.js', async () => {
  const actual = await vi.importActual('./metrics.js');
  return {
    ...actual,
    recordToolInvocation: vi.fn(),
    recordToolDuration: vi.fn(),
    recordToolError: vi.fn(),
  };
});

describe('wrapToolHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should call the original handler and return its result', async () => {
    const mockResult = { content: [{ type: 'text', text: 'success' }] };
    const mockHandler = vi.fn().mockResolvedValue(mockResult);
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    const args = { params: { foo: 'bar' } };
    const extra = {} as any;
    const result = await wrappedHandler(args, extra);

    expect(mockHandler).toHaveBeenCalledWith(args, extra);
    expect(result).toBe(mockResult);
  });

  it('should record invocation metric on success', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ content: [] });
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await wrappedHandler({ params: {} }, {} as any);

    expect(metrics.recordToolInvocation).toHaveBeenCalledWith(
      'test_tool',
      'success',
    );
  });

  it('should record duration metric on success', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ content: [] });
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await wrappedHandler({ params: {} }, {} as any);

    expect(metrics.recordToolDuration).toHaveBeenCalledWith(
      'test_tool',
      expect.any(Number),
      'success',
    );
  });

  it('should record invocation metric with error status on failure', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Error('test error'));
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await expect(wrappedHandler({ params: {} }, {} as any)).rejects.toThrow(
      'test error',
    );

    expect(metrics.recordToolInvocation).toHaveBeenCalledWith(
      'test_tool',
      'error',
    );
  });

  it('should record duration metric with error status on failure', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Error('test error'));
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await expect(wrappedHandler({ params: {} }, {} as any)).rejects.toThrow(
      'test error',
    );

    expect(metrics.recordToolDuration).toHaveBeenCalledWith(
      'test_tool',
      expect.any(Number),
      'error',
    );
  });

  it('should record error metric with error type on failure', async () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    const mockHandler = vi.fn().mockRejectedValue(new CustomError('test'));
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await expect(wrappedHandler({ params: {} }, {} as any)).rejects.toThrow();

    expect(metrics.recordToolError).toHaveBeenCalledWith(
      'test_tool',
      'CustomError',
    );
  });

  it('should record UnknownError for non-Error throws', async () => {
    const mockHandler = vi.fn().mockRejectedValue('string error');
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await expect(wrappedHandler({ params: {} }, {} as any)).rejects.toBe(
      'string error',
    );

    expect(metrics.recordToolError).toHaveBeenCalledWith(
      'test_tool',
      'UnknownError',
    );
  });

  it('should re-throw the original error', async () => {
    const originalError = new Error('original error');
    const mockHandler = vi.fn().mockRejectedValue(originalError);
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await expect(wrappedHandler({ params: {} }, {} as any)).rejects.toBe(
      originalError,
    );
  });

  it('should log debug info when debug mode is enabled', async () => {
    vi.stubEnv('debug', 'true');
    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const mockHandler = vi.fn().mockResolvedValue({ content: [] });
    const wrappedHandler = wrapToolHandler('test_tool', mockHandler);

    await wrappedHandler({ params: {} }, {} as any);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG] [Telemetry] Tool test_tool completed'),
    );

    consoleSpy.mockRestore();
  });
});
