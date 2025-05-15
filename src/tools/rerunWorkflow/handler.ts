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
  return {
    content: [
      {
        type: 'text',
        text: `New workflowId is ${newWorkflow.workflow_id}`,
      },
    ],
  };
};
