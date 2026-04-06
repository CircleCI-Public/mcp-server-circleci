/**
 * Telemetry configuration for metrics export to CircleCI ai-o11y.
 */

/** CircleCI ai-o11y metrics endpoint (PUT JSON). */
export const TELEMETRY_METRICS_URL =
  'https://runner.circleci.com/api/private/ai-o11y-pat/metric';

export const TELEMETRY_SERVICE_NAME = 'mcp-server-circleci';

export const TELEMETRY_FLUSH_INTERVAL_MS = 60_000;

export type TelemetryConfig = {
  /** True when CIRCLECI_TOKEN is set (PAT used for metrics export via Circle-Token header). */
  enabled: boolean;
  /** CircleCI PAT for metrics endpoint auth. */
  token: string;
};

/**
 * Telemetry is enabled when the customer has configured CIRCLECI_TOKEN.
 * The same PAT used for CircleCI API calls authenticates metrics export.
 */
export function getTelemetryConfig(): TelemetryConfig {
  const token = process.env.CIRCLECI_TOKEN?.trim();
  if (!token) {
    return { enabled: false, token: '' };
  }
  return { enabled: true, token };
}
