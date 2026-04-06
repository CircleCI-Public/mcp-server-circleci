/**
 * Telemetry module for CircleCI MCP Server.
 *
 * OpenTelemetry metrics for tool usage are exported to CircleCI ai-o11y when
 * CIRCLECI_TOKEN (PAT) is set.
 */

export {
  getTelemetryConfig,
  TELEMETRY_EXPORT_INTERVAL_MS,
  TELEMETRY_OTLP_METRICS_URL,
  TELEMETRY_SERVICE_NAME,
  type TelemetryConfig,
} from './config.js';
export {
  initializeMetrics,
  shutdownMetrics,
  isMetricsEnabled,
  recordToolInvocation,
  recordToolDuration,
  recordToolError,
  MetricAttributes,
  MetricStatus,
  MetricNames,
} from './metrics.js';
export { wrapToolHandler } from './wrapToolHandler.js';
