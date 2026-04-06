/**
 * Telemetry module for CircleCI MCP Server.
 *
 * Provides OpenTelemetry metrics instrumentation for tracking tool usage.
 *
 * Environment Variables:
 * - OTEL_EXPORTER_OTLP_ENDPOINT: OTLP endpoint URL (required to enable metrics)
 * - OTEL_EXPORTER_OTLP_HEADERS: Headers for authentication (format: "key1=value1,key2=value2")
 * - OTEL_SERVICE_NAME: Service name for metrics (default: "mcp-server-circleci")
 * - OTEL_METRICS_EXPORT_INTERVAL_MS: Export interval in milliseconds (default: 60000)
 */

export { getTelemetryConfig, type TelemetryConfig } from './config.js';
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
