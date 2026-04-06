import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTelemetryConfig } from './config.js';

describe('getTelemetryConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return disabled config when OTEL_EXPORTER_OTLP_ENDPOINT is not set', () => {
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(false);
    expect(config.endpoint).toBeUndefined();
  });

  it('should return enabled config when OTEL_EXPORTER_OTLP_ENDPOINT is set', () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318';

    const config = getTelemetryConfig();

    expect(config.enabled).toBe(true);
    expect(config.endpoint).toBe('http://localhost:4318');
  });

  it('should use default service name when OTEL_SERVICE_NAME is not set', () => {
    const config = getTelemetryConfig();

    expect(config.serviceName).toBe('mcp-server-circleci');
  });

  it('should use custom service name when OTEL_SERVICE_NAME is set', () => {
    process.env.OTEL_SERVICE_NAME = 'custom-service';

    const config = getTelemetryConfig();

    expect(config.serviceName).toBe('custom-service');
  });

  it('should use default export interval when OTEL_METRICS_EXPORT_INTERVAL_MS is not set', () => {
    const config = getTelemetryConfig();

    expect(config.exportIntervalMs).toBe(60000);
  });

  it('should use custom export interval when OTEL_METRICS_EXPORT_INTERVAL_MS is set', () => {
    process.env.OTEL_METRICS_EXPORT_INTERVAL_MS = '30000';

    const config = getTelemetryConfig();

    expect(config.exportIntervalMs).toBe(30000);
  });

  it('should use default export interval when OTEL_METRICS_EXPORT_INTERVAL_MS is invalid', () => {
    process.env.OTEL_METRICS_EXPORT_INTERVAL_MS = 'invalid';

    const config = getTelemetryConfig();

    expect(config.exportIntervalMs).toBe(60000);
  });

  it('should parse headers from OTEL_EXPORTER_OTLP_HEADERS', () => {
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'Authorization=Bearer token123,X-Custom=value';

    const config = getTelemetryConfig();

    expect(config.headers).toEqual({
      Authorization: 'Bearer token123',
      'X-Custom': 'value',
    });
  });

  it('should handle headers with equals signs in values', () => {
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'Authorization=Bearer token=123=abc';

    const config = getTelemetryConfig();

    expect(config.headers).toEqual({
      Authorization: 'Bearer token=123=abc',
    });
  });

  it('should return empty headers when OTEL_EXPORTER_OTLP_HEADERS is not set', () => {
    delete process.env.OTEL_EXPORTER_OTLP_HEADERS;

    const config = getTelemetryConfig();

    expect(config.headers).toEqual({});
  });
});
