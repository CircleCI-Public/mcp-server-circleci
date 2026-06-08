import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runWithCircleCIToken } from '../auth/requestContext.js';
import {
  MetricStatus,
  initializeMetrics,
  recordToolInvocation,
  shutdownMetrics,
} from './metrics.js';

describe('Metrics token routing', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.CIRCLECI_TOKEN;
    delete process.env.DISABLE_TELEMETRY;
  });

  afterEach(async () => {
    await shutdownMetrics();
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should flush metrics with the request-scoped token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await initializeMetrics();

    runWithCircleCIToken('request-token-a', () => {
      recordToolInvocation('test_tool', MetricStatus.SUCCESS);
    });

    await shutdownMetrics();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toMatchObject({
      'Circle-Token': 'request-token-a',
    });
  });

  it('should group buffered metrics by token during flush', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await initializeMetrics();

    runWithCircleCIToken('token-a', () => {
      recordToolInvocation('tool_a', MetricStatus.SUCCESS);
    });
    runWithCircleCIToken('token-b', () => {
      recordToolInvocation('tool_b', MetricStatus.SUCCESS);
    });

    await shutdownMetrics();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const tokens = fetchMock.mock.calls.map(
      ([, init]) => (init?.headers as Record<string, string>)['Circle-Token'],
    );
    expect(tokens.sort()).toEqual(['token-a', 'token-b']);
  });

  it('should skip metrics when no token is available', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await initializeMetrics();
    recordToolInvocation('test_tool', MetricStatus.SUCCESS);
    await shutdownMetrics();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
