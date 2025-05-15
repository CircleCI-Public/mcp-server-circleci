import { rerunWorkflowInputSchema } from './inputSchema.js';

export const rerunWorkflowTool = {
  name: 'rerun_workflow' as const,
  description: `
  This tool is used to rerun a workflow from failed.

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
  - A message indicating that the workflow has been rerun and provide the new workflowId.
  `,
  inputSchema: rerunWorkflowInputSchema,
};
