/**
 * OpenTelemetry metrics for CircleCI MCP Server tool usage.
 */

import { metrics, Counter, Meter } from '@opentelemetry/api';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getTelemetryConfig, TelemetryConfig } from './config.js';

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

let meterProvider: MeterProvider | null = null;
let meter: Meter | null = null;
let invocationsCounter: Counter | null = null;
let durationCounter: Counter | null = null;
let errorsCounter: Counter | null = null;
let config: TelemetryConfig | null = null;

/**
 * Initialize the OpenTelemetry metrics system.
 * This should be called once at application startup.
 */
export async function initializeMetrics(): Promise<void> {
  config = getTelemetryConfig();

  if (!config.enabled) {
    if (process.env.debug === 'true') {
      console.error(
        '[DEBUG] [Telemetry] OTEL metrics disabled (OTEL_EXPORTER_OTLP_ENDPOINT not set)',
      );
    }
    return;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${config.endpoint}/v1/metrics`,
    headers: config.headers,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: config.exportIntervalMs,
  });

  meterProvider = new MeterProvider({
    resource,
    readers: [metricReader],
  });

  metrics.setGlobalMeterProvider(meterProvider);
  meter = metrics.getMeter('mcp-server-circleci');

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
      `[DEBUG] [Telemetry] OTEL metrics initialized with endpoint: ${config.endpoint}`,
    );
  }
}

/**
 * Record a tool invocation metric.
 */
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

/**
 * Record tool execution duration in milliseconds.
 */
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

/**
 * Record a tool error metric.
 */
export function recordToolError(toolName: string, errorType: string): void {
  if (!errorsCounter) return;

  errorsCounter.add(1, {
    [MetricAttributes.TOOL_NAME]: toolName,
    [MetricAttributes.ERROR_TYPE]: errorType,
  });
}

/**
 * Shutdown the metrics system and flush any pending metrics.
 * This should be called before application exit.
 */
export async function shutdownMetrics(): Promise<void> {
  if (meterProvider) {
    try {
      await meterProvider.shutdown();
      if (process.env.debug === 'true') {
        console.error('[DEBUG] [Telemetry] OTEL metrics shutdown complete');
      }
    } catch (error) {
      console.error('[Telemetry] Error during metrics shutdown:', error);
    }
    meterProvider = null;
    meter = null;
    invocationsCounter = null;
    durationCounter = null;
    errorsCounter = null;
  }
}

/**
 * Check if metrics are enabled and initialized.
 */
export function isMetricsEnabled(): boolean {
  return config?.enabled ?? false;
}
