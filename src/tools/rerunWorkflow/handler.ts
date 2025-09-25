import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getAppURL } from '../../clients/circleci/index.js';
import { getWorkflowIdFromURL } from '../../lib/getWorkflowIdFromURL.js';

export const rerunWorkflow: ToolCallback<{
  params: typeof rerunWorkflowInputSchema;
}> = async (args) => {
  let { workflowId } = args.params || {};
  const { fromFailed, workflowURL } = args.params || {};
  const baseURL = getAppURL();
  const circleci = getCircleCIClient();

  if (workflowURL) {
    workflowId = getWorkflowIdFromURL(workflowURL);
  }

  if (!workflowId) {
    return mcpErrorOutput(
      'workflowId is required and could not be determined from workflowURL.',
    );
  }

  const workflow = await circleci.workflows.getWorkflow({
    workflowId,
  });

  if (!workflow) {
    return mcpErrorOutput('Workflow not found');
  }

  const workflowFailed = workflow?.status?.toLowerCase() === 'failed';

  if (fromFailed && !workflowFailed) {
    return mcpErrorOutput('Workflow is not failed, cannot rerun from failed');
  }

  const newWorkflow = await circleci.workflows.rerunWorkflow({
    workflowId,
    fromFailed: fromFailed !== undefined ? fromFailed : workflowFailed,
  });

  const workflowUrl = `${baseURL}/pipelines/workflows/${newWorkflow.workflow_id}`;
  return {
    content: [
      {
        type: 'text',
        text: `New workflowId is ${newWorkflow.workflow_id} and [View Workflow in CircleCI](${workflowUrl})`,
      },
    ],
  };
};
