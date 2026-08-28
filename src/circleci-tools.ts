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
import { runPipeline } from './tools/runPipeline/handler.js';
import { runPipelineTool } from './tools/runPipeline/tool.js';
import { listFollowedProjectsTool } from './tools/listFollowedProjects/tool.js';
import { listFollowedProjects } from './tools/listFollowedProjects/handler.js';
import { rerunWorkflowTool } from './tools/rerunWorkflow/tool.js';
import { rerunWorkflow } from './tools/rerunWorkflow/handler.js';
import { downloadUsageApiDataTool } from './tools/downloadUsageApiData/tool.js';
import { downloadUsageApiData } from './tools/downloadUsageApiData/handler.js';
import { findUnderusedResourceClassesTool } from './tools/findUnderusedResourceClasses/tool.js';
import { findUnderusedResourceClasses } from './tools/findUnderusedResourceClasses/handler.js';
import { runRollbackPipelineTool } from './tools/runRollbackPipeline/tool.js';
import { runRollbackPipeline } from './tools/runRollbackPipeline/handler.js';

import { listComponentVersionsTool } from './tools/listComponentVersions/tool.js';
import { listComponentVersions } from './tools/listComponentVersions/handler.js';

import { listArtifactsTool } from './tools/listArtifacts/tool.js';
import { listArtifacts } from './tools/listArtifacts/handler.js';

import { getOrbDetailsTool } from './tools/getOrbDetails/tool.js';
import { getOrbDetails } from './tools/getOrbDetails/handler.js';

import { searchOrbsTool } from './tools/searchOrbs/tool.js';
import { searchOrbs } from './tools/searchOrbs/handler.js';

// Define the tools with their configurations
export const CCI_TOOLS = [
  getBuildFailureLogsTool,
  getFlakyTestLogsTool,
  getLatestPipelineStatusTool,
  getJobTestResultsTool,
  configHelperTool,
  runPipelineTool,
  listFollowedProjectsTool,
  rerunWorkflowTool,
  downloadUsageApiDataTool,
  findUnderusedResourceClassesTool,
  runRollbackPipelineTool,
  listComponentVersionsTool,
  listArtifactsTool,
  getOrbDetailsTool,
  searchOrbsTool,
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
  run_pipeline: runPipeline,
  list_followed_projects: listFollowedProjects,
  rerun_workflow: rerunWorkflow,
  download_usage_api_data: downloadUsageApiData,
  find_underused_resource_classes: findUnderusedResourceClasses,
  run_rollback_pipeline: runRollbackPipeline,
  list_component_versions: listComponentVersions,
  list_artifacts: listArtifacts,
  get_orb_details: getOrbDetails,
  search_orbs: searchOrbs,
} satisfies ToolHandlers;
