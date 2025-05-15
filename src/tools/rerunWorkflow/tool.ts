import { rerunWorkflowInputSchema } from './inputSchema.js';

export const rerunWorkflowTool = {
  name: 'rerun_workflow' as const,
  description: `
  This tool is used to rerun a workflow from failed.

  Common use cases:
  - Rerun a workflow from failed
  - Rerun a workflow from started

  Parameters:
  - params: An object containing:
    - workflowId: string - A message provided by the user that will be echoed back.

  Example usage:
  {
    "params": {
      "workflowId": "a12145c5-90f8-4cc9-98f2-36cb85db9e4b"
    }
  }

  Returns:
  - A message indicating that the workflow has been rerun and provide the new workflowId and url if the workflow is successful.
  
  retrieve the workflowId from the workflow URL if it is available

  `,
  inputSchema: rerunWorkflowInputSchema,
};
