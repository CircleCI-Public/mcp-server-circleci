/**
 * Metrics for CircleCI MCP Server tool usage.
 *
 * Buffers metric data and flushes to the CircleCI ai-o11y PUT /metric endpoint
 * in the same JSON format used by test-agent.
 */

import {
  getTelemetryConfig,
  TELEMETRY_FLUSH_INTERVAL_MS,
  TELEMETRY_METRICS_URL,
  TELEMETRY_SERVICE_NAME,
  type TelemetryConfig,
} from './config.js';

/** Metric attribute names */
export const METRIC_ATTR_TOOL_NAME = 'tool_name';
export const METRIC_ATTR_STATUS = 'status';
export const METRIC_ATTR_ERROR_TYPE = 'error_type';

/** Status values for metrics */
export enum MetricStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Metric names following mcp.tool prefix convention.
 * The ai-o11y proxy prepends "circleci." for non-api-key auth,
 * so final Datadog names become circleci.mcp.tool.*.
 */
export const METRIC_NAME_INVOCATIONS = 'mcp.tool.invocations';
export const METRIC_NAME_DURATION_MS = 'mcp.tool.duration_ms';
export const METRIC_NAME_ERRORS = 'mcp.tool.errors';

type MetricType = 'histogram' | 'count' | 'gauge' | 'timeInMilliseconds';

type MetricData = {
  type: MetricType;
  name: string;
  value: number;
  tags: string[];
};

const FLUSH_TIMEOUT_MS = 10_000;

let config: TelemetryConfig | null = null;
let buffer: MetricData[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

export async function initializeMetrics(): Promise<void> {
  config = getTelemetryConfig();

  if (!config.enabled) {
    if (process.env.debug === 'true') {
      console.error(
        '[DEBUG] [Telemetry] Metrics disabled (DISABLE_TELEMETRY=true or CIRCLECI_TOKEN not set)',
      );
    }
    return;
  }

  flushTimer = setInterval(() => {
    flush().catch((error) => {
      console.error('[Telemetry] Metric flush error:', error);
    });
  }, TELEMETRY_FLUSH_INTERVAL_MS);
  flushTimer.unref();

  if (process.env.debug === 'true') {
    console.error(
      `[DEBUG] [Telemetry] Metrics initialized with endpoint: ${TELEMETRY_METRICS_URL}`,
    );
  }
}

function record(
  type: MetricType,
  name: string,
  value: number,
  tags: string[],
): void {
  if (!config?.enabled) return;
  buffer.push({ type, name, value, tags });
}

export function recordToolInvocation(
  toolName: string,
  status: MetricStatus,
): void {
  record('count', METRIC_NAME_INVOCATIONS, 1, [
    `${METRIC_ATTR_TOOL_NAME}:${toolName}`,
    `${METRIC_ATTR_STATUS}:${status}`,
  ]);
}

export function recordToolDuration(
  toolName: string,
  durationMs: number,
  status: MetricStatus,
): void {
  record('timeInMilliseconds', METRIC_NAME_DURATION_MS, durationMs, [
    `${METRIC_ATTR_TOOL_NAME}:${toolName}`,
    `${METRIC_ATTR_STATUS}:${status}`,
  ]);
}

export function recordToolError(toolName: string, errorType: string): void {
  record('count', METRIC_NAME_ERRORS, 1, [
    `${METRIC_ATTR_TOOL_NAME}:${toolName}`,
    `${METRIC_ATTR_ERROR_TYPE}:${errorType}`,
  ]);
}

async function flush(): Promise<void> {
  if (!config?.enabled || buffer.length === 0) return;

  const metrics = buffer.splice(0);
  const body = JSON.stringify({
    metrics,
    tags: [`service:${TELEMETRY_SERVICE_NAME}`],
  });

  try {
    const response = await fetch(TELEMETRY_METRICS_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Circle-Token': config.token,
      },
      body,
      signal: AbortSignal.timeout(FLUSH_TIMEOUT_MS),
    });

    if (!response.ok && process.env.debug === 'true') {
      console.error(
        `[DEBUG] [Telemetry] Metric flush failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    if (process.env.debug === 'true') {
      console.error(
        '[DEBUG] [Telemetry] Metric flush error:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

export async function shutdownMetrics(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  await flush();

  config = null;
  buffer = [];

  if (process.env.debug === 'true') {
    console.error('[DEBUG] [Telemetry] Metrics shutdown complete');
  }
}

export function isMetricsEnabled(): boolean {
  return config?.enabled ?? false;
}
