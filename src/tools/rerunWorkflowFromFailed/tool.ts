import { rerunWorkflowFromFailedInputSchema } from './inputSchema.js';

export const rerunWorkflowFromFailedTool = {
  name: 'rerun_workflow_from_failed' as const,
  description: `
  This tool is a basic "hello world" tool that echoes back a message provided by the user.

  Parameters:
  - params: An object containing:
    - message: string - A message provided by the user that will be echoed back.

  Example usage:
  {
    "params": {
      "message": "Hello, world!"
    }
  }

  Returns:
  - The message provided by the user.
  `,
  inputSchema: rerunWorkflowFromFailedInputSchema,
};
