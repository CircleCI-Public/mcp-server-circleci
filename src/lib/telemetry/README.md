# MCP Server Telemetry

OpenTelemetry metrics for tracking tool usage.

## Metrics

| Metric | Description |
|--------|-------------|
| `circleci.mcp.tool.invocations` | Tool invocation count |
| `circleci.mcp.tool.duration_ms` | Execution time in ms |
| `circleci.mcp.tool.errors` | Error count |

All metrics include `tool_name` and `status` (success/error) attributes.

## Configuration

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to enable metrics export.

| Variable | Default |
|----------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | _(disabled)_ |
| `OTEL_EXPORTER_OTLP_HEADERS` | _(none)_ |
| `OTEL_SERVICE_NAME` | `mcp-server-circleci` |
| `OTEL_METRICS_EXPORT_INTERVAL_MS` | `60000` |
