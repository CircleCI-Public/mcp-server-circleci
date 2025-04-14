import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getBuildFailureLogsTool } from './tools/getBuildFailureLogs/tool.js';
import { getBuildFailureLogs } from './tools/getBuildFailureLogs/handler.js';
import { getFlakyTestLogsTool } from './tools/getFlakyTests/tool.js';
import { getFlakyTestLogs } from './tools/getFlakyTests/handler.js';
import { projectWorkflowMetricsTool } from './tools/getProjectWorkflowMetrics/tool.js';
import { projectWorkflowMetrics } from './tools/getProjectWorkflowMetrics/handler.js';
import { projectWorkflowJobMetricsTool } from './tools/getProjectWorkflowJobMetrics/tool.js';
import { projectWorkflowJobMetrics } from './tools/getProjectWorkflowJobMetrics/handler.js';
import { projectWorkflowTestMetricsTool } from './tools/getProjectWorkflowTestMetrics/tool.js';
import { projectWorkflowTestMetrics } from './tools/getProjectWorkflowTestMetrics/handler.js';

// Define the tools with their configurations
export const CCI_TOOLS = [
  getBuildFailureLogsTool,
  getFlakyTestLogsTool,
  projectWorkflowMetricsTool,
  projectWorkflowJobMetricsTool,
  projectWorkflowTestMetricsTool,
];

// Extract the tool names as a union type
type CCIToolName = (typeof CCI_TOOLS)[number]['name'];

export type ToolHandler<T extends CCIToolName> = ToolCallback<{
  params: Extract<(typeof CCI_TOOLS)[number], { name: T }>['inputSchema'];
}>;

// Create a type for the tool handlers that directly maps each tool to its appropriate input schema
type ToolHandlers = {
  [K in CCIToolName]: ToolHandler<K>;
};

export const CCI_HANDLERS = {
  get_build_failure_logs: getBuildFailureLogs,
  find_flaky_tests: getFlakyTestLogs,
  get_project_workflow_metrics: projectWorkflowMetrics,
  get_project_workflow_job_metrics: projectWorkflowJobMetrics,
  get_project_workflow_test_metrics: projectWorkflowTestMetrics,
} satisfies ToolHandlers;
