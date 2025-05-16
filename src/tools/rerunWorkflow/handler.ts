import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const rerunWorkflow: ToolCallback<{
  params: typeof rerunWorkflowInputSchema;
}> = async (args) => {
  const { workflowId } = args.params;
  const circleci = getCircleCIClient();
  const newWorkflow = await circleci.workflows.rerunWorkflow({
    workflowId,
    fromFailed: true,
  });

  if (newWorkflow.workflow_id) {
    const workflow = await circleci.workflows.getWorkflow({
      workflowId: newWorkflow.workflow_id,
    });
    const workflowUrl = `https://app.circleci.com/pipelines/${workflow.project_slug}/${workflow.pipeline_number}/workflows/${workflow.id}`;
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
