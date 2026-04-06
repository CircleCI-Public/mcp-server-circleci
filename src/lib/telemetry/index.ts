/**
 * Telemetry module for CircleCI MCP Server.
 *
 * Metrics for tool usage are exported to CircleCI ai-o11y when
 * CIRCLECI_TOKEN (PAT) is set.
 */

export {
  getTelemetryConfig,
  TELEMETRY_FLUSH_INTERVAL_MS,
  TELEMETRY_METRICS_URL,
  TELEMETRY_SERVICE_NAME,
  type TelemetryConfig,
} from './config.js';
export {
  initializeMetrics,
  isMetricsEnabled,
  MetricAttributes,
  MetricNames,
  MetricStatus,
  recordToolDuration,
  recordToolError,
  recordToolInvocation,
  shutdownMetrics,
} from './metrics.js';
export { wrapToolHandler } from './wrapToolHandler.js';
