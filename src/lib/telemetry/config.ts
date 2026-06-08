/**
 * Telemetry configuration for metrics export to CircleCI ai-o11y.
 */

/** CircleCI ai-o11y metrics endpoint (PUT JSON). */
export const TELEMETRY_METRICS_URL =
  'https://runner.circleci.com/api/private/ai-o11y-pat/metric';

export const TELEMETRY_SERVICE_NAME = 'mcp-server-circleci';

export const TELEMETRY_FLUSH_INTERVAL_MS = 60_000;

export type TelemetryConfig = {
  /** True when telemetry has not been opted out via DISABLE_TELEMETRY=true. */
  enabled: boolean;
  /** Fallback CircleCI PAT for metrics when no request-scoped token is available. */
  token: string;
};

/**
 * Telemetry is enabled unless DISABLE_TELEMETRY=true.
 * Metrics are authenticated with the request-scoped token when available,
 * otherwise CIRCLECI_TOKEN from the process environment.
 */
export function getTelemetryConfig(): TelemetryConfig {
  if (process.env.DISABLE_TELEMETRY === 'true') {
    return { enabled: false, token: '' };
  }
  const token = process.env.CIRCLECI_TOKEN?.trim() || '';
  return { enabled: true, token };
}
