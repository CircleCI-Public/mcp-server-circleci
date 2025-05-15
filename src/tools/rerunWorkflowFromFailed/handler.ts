import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowFromFailedInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';

export const rerunWorkflowFromFailed: ToolCallback<{
  params: typeof rerunWorkflowFromFailedInputSchema;
}> = async (args) => {
  const { workflowId } = args.params;
  const circleci = getCircleCIClient();
  const newWorkflow = await circleci.rerunWorkflow.rerunWorkflowFromFailed({
    workflowId,
  });
  return {
    content: [
      {
        type: 'text',
        text: `New workflowId is ${newWorkflow.workflow_id}`,
      },
    ],
  };
};
