import { rerunWorkflowInputSchema } from './inputSchema.js';

export const rerunWorkflowTool = {
  name: 'rerun_workflow' as const,
  description: `
  This tool is used to rerun a workflow from started or failed.

  Common use cases:
  - Rerun a workflow from failed
  - Rerun a workflow from started

Input options (EXACTLY ONE of these TWO options must be used):

Option 1 - Workflow ID:
- workflowId: The ID of the workflow to rerun
- fromFailed: true by default (optional)

Option 2 - Workflow URL:
- workflowURL: The URL of the workflow to rerun
  * Workflow URL: https://app.circleci.com/pipelines/:vcsType/:orgName/:projectName/:pipelineNumber/workflows/:workflowId
  * Workflow Job URL: https://app.circleci.com/pipelines/:vcsType/:orgName/:projectName/:pipelineNumber/workflows/:workflowId/jobs/:buildNumber
- fromFailed: true by default (optional)
  `,
  inputSchema: rerunWorkflowInputSchema,
};
