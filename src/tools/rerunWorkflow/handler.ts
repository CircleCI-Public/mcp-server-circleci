import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getBaseURL } from '../../clients/circleci/index.js';

export const rerunWorkflow: ToolCallback<{
  params: typeof rerunWorkflowInputSchema;
}> = async (args) => {
  const { workflowId, fromFailed } = args.params;
  const baseURL = getBaseURL(false, true);
  const circleci = getCircleCIClient();
  const newWorkflow = await circleci.workflows.rerunWorkflow({
    workflowId,
    fromFailed: fromFailed ?? true,
  });

  if (newWorkflow.workflow_id) {
    const workflow = await circleci.workflows.getWorkflow({
      workflowId: newWorkflow.workflow_id,
    });
    const workflowUrl = `${baseURL}/pipelines/${workflow.project_slug}/${workflow.pipeline_number}/workflows/${workflow.id}`;
    return {
      content: [
        {
          type: 'text',
          text: `New workflowId is ${newWorkflow.workflow_id} and [View Workflow in CircleCI](${workflowUrl})`,
        },
      ],
    };
  }

  return mcpErrorOutput('Failed to rerun workflow.');
};
