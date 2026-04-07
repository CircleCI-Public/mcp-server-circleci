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
  METRIC_ATTR_ERROR_TYPE,
  METRIC_ATTR_STATUS,
  METRIC_ATTR_TOOL_NAME,
  METRIC_NAME_DURATION_MS,
  METRIC_NAME_ERRORS,
  METRIC_NAME_INVOCATIONS,
  MetricStatus,
  recordToolDuration,
  recordToolError,
  recordToolInvocation,
  shutdownMetrics,
} from './metrics.js';
export { type ToolHandler, wrapToolHandler } from './wrapToolHandler.js';
