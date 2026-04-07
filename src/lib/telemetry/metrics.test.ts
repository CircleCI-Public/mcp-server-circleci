import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  METRIC_ATTR_ERROR_TYPE,
  METRIC_ATTR_STATUS,
  METRIC_ATTR_TOOL_NAME,
  METRIC_NAME_DURATION_MS,
  METRIC_NAME_ERRORS,
  METRIC_NAME_INVOCATIONS,
  MetricStatus,
} from './metrics.js';

describe('Metric constants', () => {
  it('should have correct metric names', () => {
    expect(METRIC_NAME_INVOCATIONS).toBe('mcp.tool.invocations');
    expect(METRIC_NAME_DURATION_MS).toBe('mcp.tool.duration_ms');
    expect(METRIC_NAME_ERRORS).toBe('mcp.tool.errors');
  });

  it('should all start with mcp.tool prefix (ai-o11y proxy prepends circleci.)', () => {
    for (const name of [METRIC_NAME_INVOCATIONS, METRIC_NAME_DURATION_MS, METRIC_NAME_ERRORS]) {
      expect(name).toMatch(/^mcp\.tool\./);
    }
  });

  it('should have correct attribute names', () => {
    expect(METRIC_ATTR_TOOL_NAME).toBe('tool_name');
    expect(METRIC_ATTR_STATUS).toBe('status');
    expect(METRIC_ATTR_ERROR_TYPE).toBe('error_type');
  });

  it('should have correct status values', () => {
    expect(MetricStatus.SUCCESS).toBe('success');
    expect(MetricStatus.ERROR).toBe('error');
  });
});

describe('Metrics initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not throw when metrics are disabled', async () => {
    delete process.env.CIRCLECI_TOKEN;

    const { initializeMetrics, isMetricsEnabled } = await import(
      './metrics.js'
    );

    await expect(initializeMetrics()).resolves.not.toThrow();
    expect(isMetricsEnabled()).toBe(false);
  });

  it('should report metrics as disabled when CIRCLECI_TOKEN is not set', async () => {
    delete process.env.CIRCLECI_TOKEN;

    const { initializeMetrics, isMetricsEnabled } = await import(
      './metrics.js'
    );
    await initializeMetrics();

    expect(isMetricsEnabled()).toBe(false);
  });
});

describe('Metrics recording when disabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.CIRCLECI_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not throw when recording invocation with metrics disabled', async () => {
    const { recordToolInvocation } = await import('./metrics.js');

    expect(() => {
      recordToolInvocation('test_tool', MetricStatus.SUCCESS);
    }).not.toThrow();
  });

  it('should not throw when recording duration with metrics disabled', async () => {
    const { recordToolDuration } = await import('./metrics.js');

    expect(() => {
      recordToolDuration('test_tool', 100, MetricStatus.SUCCESS);
    }).not.toThrow();
  });

  it('should not throw when recording error with metrics disabled', async () => {
    const { recordToolError } = await import('./metrics.js');

    expect(() => {
      recordToolError('test_tool', 'TestError');
    }).not.toThrow();
  });
});
