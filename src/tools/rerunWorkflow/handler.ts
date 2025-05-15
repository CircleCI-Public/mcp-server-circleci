import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';

export const rerunWorkflow: ToolCallback<{
  params: typeof rerunWorkflowInputSchema;
}> = async (args) => {
  const { workflowId } = args.params;
  const circleci = getCircleCIClient();
  const newWorkflow = await circleci.rerunWorkflow.rerunWorkflow({
    workflowId,
    fromFailed: true,
  });

  if (newWorkflow.workflow_id) {
    const workflow = await circleci.workflow.getWorkflow({
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

  return {
    content: [
      {
        type: 'text',
        text: `New workflowId is ${newWorkflow.workflow_id}`,
      },
    ],
  };
};
