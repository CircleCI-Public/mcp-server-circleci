/**
 * Telemetry configuration from environment variables.
 */

export type TelemetryConfig = {
  /** Whether telemetry is enabled (requires OTEL_EXPORTER_OTLP_ENDPOINT) */
  enabled: boolean;
  /** OTLP endpoint URL for metrics export */
  endpoint: string | undefined;
  /** Headers for OTLP exporter (e.g., for authentication) */
  headers: Record<string, string>;
  /** Service name for metrics */
  serviceName: string;
  /** Export interval in milliseconds */
  exportIntervalMs: number;
};

/**
 * Parse headers from OTEL_EXPORTER_OTLP_HEADERS environment variable.
 * Format: "key1=value1,key2=value2"
 */
function parseHeaders(headersStr: string | undefined): Record<string, string> {
  if (!headersStr) {
    return {};
  }

  const headers: Record<string, string> = {};
  const pairs = headersStr.split(',');

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      headers[key.trim()] = valueParts.join('=').trim();
    }
  }

  return headers;
}

/**
 * Get telemetry configuration from environment variables.
 */
export function getTelemetryConfig(): TelemetryConfig {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);
  const serviceName =
    process.env.OTEL_SERVICE_NAME || 'mcp-server-circleci';
  const exportIntervalMs = parseInt(
    process.env.OTEL_METRICS_EXPORT_INTERVAL_MS || '60000',
    10,
  );

  return {
    enabled: !!endpoint,
    endpoint,
    headers,
    serviceName,
    exportIntervalMs: isNaN(exportIntervalMs) ? 60000 : exportIntervalMs,
  };
}
