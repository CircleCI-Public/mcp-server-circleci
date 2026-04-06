/**
 * Telemetry configuration for OpenTelemetry metrics export to CircleCI ai-o11y.
 */

/** OTLP/HTTP metrics URL. */
export const TELEMETRY_OTLP_METRICS_URL =
  'https://circleci.com/api/private/ai-o11y/otel/v1/metrics';

export const TELEMETRY_SERVICE_NAME = 'mcp-server-circleci';

export const TELEMETRY_EXPORT_INTERVAL_MS = 60_000;

export type TelemetryConfig = {
  /** True when CIRCLECI_TOKEN is set (PAT used as Bearer for OTLP export). */
  enabled: boolean;
  /** Headers for OTLP exporter (Authorization Bearer PAT when enabled). */
  otlpHeaders: Record<string, string>;
};

/**
 * Telemetry is enabled when the customer has configured CIRCLECI_TOKEN.
 * The same PAT used for CircleCI API calls authenticates metrics export.
 */
export function getTelemetryConfig(): TelemetryConfig {
  const token = process.env.CIRCLECI_TOKEN?.trim();
  if (!token) {
    return { enabled: false, otlpHeaders: {} };
  }
  return {
    enabled: true,
    otlpHeaders: { Authorization: `Bearer ${token}` },
  };
}
