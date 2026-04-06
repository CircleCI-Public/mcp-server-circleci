/**
 * OpenTelemetry metrics for CircleCI MCP Server tool usage.
 *
 * Uses @opentelemetry/sdk-node for unified lifecycle management.
 */

import { metrics, Counter, Meter } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  getTelemetryConfig,
  TELEMETRY_EXPORT_INTERVAL_MS,
  TELEMETRY_OTLP_METRICS_URL,
  TELEMETRY_SERVICE_NAME,
  type TelemetryConfig,
} from './config.js';

/** Metric attribute names */
export const MetricAttributes = {
  TOOL_NAME: 'tool_name',
  STATUS: 'status',
  ERROR_TYPE: 'error_type',
} as const;

/** Status values for metrics */
export const MetricStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

/** Metric names following circleci.mcp.tool prefix convention */
export const MetricNames = {
  INVOCATIONS: 'circleci.mcp.tool.invocations',
  DURATION_MS: 'circleci.mcp.tool.duration_ms',
  ERRORS: 'circleci.mcp.tool.errors',
} as const;

let sdk: NodeSDK | null = null;
let meter: Meter | null = null;
let invocationsCounter: Counter | null = null;
let durationCounter: Counter | null = null;
let errorsCounter: Counter | null = null;
let config: TelemetryConfig | null = null;

export async function initializeMetrics(): Promise<void> {
  config = getTelemetryConfig();

  if (!config.enabled) {
    if (process.env.debug === 'true') {
      console.error(
        '[DEBUG] [Telemetry] OTEL metrics disabled (CIRCLECI_TOKEN not set)',
      );
    }
    return;
  }

  sdk = new NodeSDK({
    serviceName: TELEMETRY_SERVICE_NAME,
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: TELEMETRY_OTLP_METRICS_URL,
        headers: config.otlpHeaders,
      }),
      exportIntervalMillis: TELEMETRY_EXPORT_INTERVAL_MS,
    }),
  });

  sdk.start();

  meter = metrics.getMeter(TELEMETRY_SERVICE_NAME);

  invocationsCounter = meter.createCounter(MetricNames.INVOCATIONS, {
    description: 'Number of tool invocations',
    unit: '1',
  });

  durationCounter = meter.createCounter(MetricNames.DURATION_MS, {
    description: 'Tool execution duration in milliseconds',
    unit: 'ms',
  });

  errorsCounter = meter.createCounter(MetricNames.ERRORS, {
    description: 'Number of tool errors',
    unit: '1',
  });

  if (process.env.debug === 'true') {
    console.error(
      `[DEBUG] [Telemetry] OTEL metrics initialized with endpoint: ${TELEMETRY_OTLP_METRICS_URL}`,
    );
  }
}

export function recordToolInvocation(
  toolName: string,
  status: (typeof MetricStatus)[keyof typeof MetricStatus],
): void {
  if (!invocationsCounter) return;

  invocationsCounter.add(1, {
    [MetricAttributes.TOOL_NAME]: toolName,
    [MetricAttributes.STATUS]: status,
  });
}

export function recordToolDuration(
  toolName: string,
  durationMs: number,
  status: (typeof MetricStatus)[keyof typeof MetricStatus],
): void {
  if (!durationCounter) return;

  durationCounter.add(durationMs, {
    [MetricAttributes.TOOL_NAME]: toolName,
    [MetricAttributes.STATUS]: status,
  });
}

export function recordToolError(toolName: string, errorType: string): void {
  if (!errorsCounter) return;

  errorsCounter.add(1, {
    [MetricAttributes.TOOL_NAME]: toolName,
    [MetricAttributes.ERROR_TYPE]: errorType,
  });
}

export async function shutdownMetrics(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      if (process.env.debug === 'true') {
        console.error('[DEBUG] [Telemetry] OTEL metrics shutdown complete');
      }
    } catch (error) {
      console.error('[Telemetry] Error during metrics shutdown:', error);
    }
    sdk = null;
    meter = null;
    invocationsCounter = null;
    durationCounter = null;
    errorsCounter = null;
  }
}

export function isMetricsEnabled(): boolean {
  return config?.enabled ?? false;
}
