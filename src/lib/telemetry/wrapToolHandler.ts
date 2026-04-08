/**
 * Tool handler wrapper for OpenTelemetry metrics instrumentation.
 */

import {
  MetricStatus,
  recordToolDuration,
  recordToolError,
  recordToolInvocation,
} from './metrics.js';

export type ToolHandler = (args: any, extra: any) => Promise<any>;

/**
 * Wrap a tool handler with telemetry metrics instrumentation.
 *
 * This wrapper:
 * 1. Records the start time
 * 2. Executes the original handler
 * 3. Records invocation count with success/error status
 * 4. Records execution duration
 * 5. Records error details if the handler throws
 *
 * @param toolName - The name of the tool being wrapped
 * @param handler - The original tool handler function
 * @returns A wrapped handler that records metrics
 */
export function wrapToolHandler(toolName: string, handler: ToolHandler): ToolHandler {
  return async (args, extra) => {
    const startTime = performance.now();
    let status = MetricStatus.SUCCESS;

    try {
      const result = await handler(args, extra);
      return result;
    } catch (error) {
      status = MetricStatus.ERROR;

      const errorType =
        error instanceof Error ? error.constructor.name : 'UnknownError';
      recordToolError(toolName, errorType);

      throw error;
    } finally {
      const durationMs = Math.round(performance.now() - startTime);

      recordToolInvocation(toolName, status);
      recordToolDuration(toolName, durationMs, status);

      if (process.env.debug === 'true') {
        console.error(
          `[DEBUG] [Telemetry] Tool ${toolName} completed in ${durationMs}ms with status: ${status}`,
        );
      }
    }
  };
}
