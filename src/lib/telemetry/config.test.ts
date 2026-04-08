import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTelemetryConfig,
  TELEMETRY_FLUSH_INTERVAL_MS,
  TELEMETRY_METRICS_URL,
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
    expect(config.token).toBe('');
  });

  it('should return enabled config with token when CIRCLECI_TOKEN is set', () => {
    process.env.CIRCLECI_TOKEN = 'pat-token-abc';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(true);
    expect(config.token).toBe('pat-token-abc');
  });

  it('should treat whitespace-only CIRCLECI_TOKEN as disabled', () => {
    process.env.CIRCLECI_TOKEN = '   ';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(false);
  });

  it('should return disabled config when DISABLE_TELEMETRY is true', () => {
    process.env.CIRCLECI_TOKEN = 'pat-token-abc';
    process.env.DISABLE_TELEMETRY = 'true';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(false);
    expect(config.token).toBe('');
  });

  it('should remain enabled when DISABLE_TELEMETRY is not true', () => {
    process.env.CIRCLECI_TOKEN = 'pat-token-abc';
    process.env.DISABLE_TELEMETRY = 'false';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(true);
  });
});

describe('telemetry constants', () => {
  it('should use ai-o11y-pat metric URL', () => {
    expect(TELEMETRY_METRICS_URL).toBe(
      'https://runner.circleci.com/api/private/ai-o11y-pat/metric',
    );
  });

  it('should use fixed service name', () => {
    expect(TELEMETRY_SERVICE_NAME).toBe('mcp-server-circleci');
  });

  it('should use fixed flush interval', () => {
    expect(TELEMETRY_FLUSH_INTERVAL_MS).toBe(60_000);
  });
});
