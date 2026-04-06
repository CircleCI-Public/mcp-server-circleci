import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MetricAttributes, MetricNames, MetricStatus } from './metrics.js';

describe('Metric constants', () => {
  describe('MetricNames', () => {
    it('should have correct metric name prefixes', () => {
      expect(MetricNames.INVOCATIONS).toBe('circleci.mcp.tool.invocations');
      expect(MetricNames.DURATION_MS).toBe('circleci.mcp.tool.duration_ms');
      expect(MetricNames.ERRORS).toBe('circleci.mcp.tool.errors');
    });

    it('should all start with circleci.mcp.tool prefix', () => {
      Object.values(MetricNames).forEach((name) => {
        expect(name).toMatch(/^circleci\.mcp\.tool\./);
      });
    });
  });

  describe('MetricAttributes', () => {
    it('should have correct attribute names', () => {
      expect(MetricAttributes.TOOL_NAME).toBe('tool_name');
      expect(MetricAttributes.STATUS).toBe('status');
      expect(MetricAttributes.ERROR_TYPE).toBe('error_type');
    });
  });

  describe('MetricStatus', () => {
    it('should have correct status values', () => {
      expect(MetricStatus.SUCCESS).toBe('success');
      expect(MetricStatus.ERROR).toBe('error');
    });
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
