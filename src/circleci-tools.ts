import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getBuildFailureLogsTool } from './tools/getBuildFailureLogs/tool.js';
import { getBuildFailureLogs } from './tools/getBuildFailureLogs/handler.js';
import { getFlakyTestLogsTool } from './tools/getFlakyTests/tool.js';
import { getFlakyTestLogs } from './tools/getFlakyTests/handler.js';
import { getLatestPipelineStatusTool } from './tools/getLatestPipelineStatus/tool.js';
import { getLatestPipelineStatus } from './tools/getLatestPipelineStatus/handler.js';
import { getJobTestResultsTool } from './tools/getJobTestResults/tool.js';
import { getJobTestResults } from './tools/getJobTestResults/handler.js';
import { configHelper } from './tools/configHelper/handler.js';
import { configHelperTool } from './tools/configHelper/tool.js';
import { createPromptTemplate } from './tools/createPromptTemplate/handler.js';
import { createPromptTemplateTool } from './tools/createPromptTemplate/tool.js';
import { recommendPromptTemplateTestsTool } from './tools/recommendPromptTemplateTests/tool.js';
import { recommendPromptTemplateTests } from './tools/recommendPromptTemplateTests/handler.js';
import { runPipeline } from './tools/runPipeline/handler.js';
import { runPipelineTool } from './tools/runPipeline/tool.js';
import { listFollowedProjectsTool } from './tools/listFollowedProjects/tool.js';
import { listFollowedProjects } from './tools/listFollowedProjects/handler.js';
import { runEvaluationTestsTool } from './tools/runEvaluationTests/tool.js';
import { runEvaluationTests } from './tools/runEvaluationTests/handler.js';

// Define the tools with their configurations
export const CCI_TOOLS = [
  getBuildFailureLogsTool,
  getFlakyTestLogsTool,
  getLatestPipelineStatusTool,
  getJobTestResultsTool,
  configHelperTool,
  createPromptTemplateTool,
  recommendPromptTemplateTestsTool,
  runPipelineTool,
  listFollowedProjectsTool,
  runEvaluationTestsTool,
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
  get_latest_pipeline_status: getLatestPipelineStatus,
  get_job_test_results: getJobTestResults,
  config_helper: configHelper,
  create_prompt_template: createPromptTemplate,
  recommend_prompt_template_tests: recommendPromptTemplateTests,
  run_pipeline: runPipeline,
  list_followed_projects: listFollowedProjects,
  run_evaluation_tests: runEvaluationTests,
} satisfies ToolHandlers;
