import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getAppURL } from '../../clients/circleci/index.js';
import { getWorkflowIdFromURL } from '../../lib/getWorkflowIdFromURL.js';

export const rerunWorkflow: ToolCallback<{
  params: typeof rerunWorkflowInputSchema;
}> = async (args) => {
  let { workflowId } = args.params;
  const { fromFailed, workflowURL } = args.params;
  const baseURL = getAppURL(true);
  const circleci = getCircleCIClient();

  if (workflowURL) {
    workflowId = getWorkflowIdFromURL(workflowURL);
  }

  if (!workflowId) {
    return mcpErrorOutput(
      'workflowId is required and could not be determined from workflowURL.',
    );
  }

  const newWorkflow = await circleci.workflows.rerunWorkflow({
    workflowId,
    fromFailed: fromFailed ?? true,
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
