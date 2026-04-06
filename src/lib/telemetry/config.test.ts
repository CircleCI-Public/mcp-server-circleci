import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTelemetryConfig,
  TELEMETRY_EXPORT_INTERVAL_MS,
  TELEMETRY_OTLP_METRICS_URL,
  TELEMETRY_SERVICE_NAME,
} from './config.js';

describe('getTelemetryConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return disabled config when CIRCLECI_TOKEN is not set', () => {
    delete process.env.CIRCLECI_TOKEN;

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(false);
    expect(config.otlpHeaders).toEqual({});
  });

  it('should return enabled config with Bearer PAT when CIRCLECI_TOKEN is set', () => {
    process.env.CIRCLECI_TOKEN = 'pat-token-abc';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(true);
    expect(config.otlpHeaders).toEqual({
      Authorization: 'Bearer pat-token-abc',
    });
  });

  it('should treat whitespace-only CIRCLECI_TOKEN as disabled', () => {
    process.env.CIRCLECI_TOKEN = '   ';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(false);
  });
});

describe('telemetry constants', () => {
  it('should use fixed OTLP metrics URL aligned with test-agent ai-o11y', () => {
    expect(TELEMETRY_OTLP_METRICS_URL).toBe(
      'https://circleci.com/api/private/ai-o11y/otel/v1/metrics',
    );
  });

  it('should use fixed service name', () => {
    expect(TELEMETRY_SERVICE_NAME).toBe('mcp-server-circleci');
  });

  it('should use fixed export interval', () => {
    expect(TELEMETRY_EXPORT_INTERVAL_MS).toBe(60_000);
  });
});
