import { rerunWorkflowInputSchema } from './inputSchema.js';

export const rerunWorkflowTool = {
  name: 'rerun_workflow' as const,
  description: `
  This tool reruns a workflow with various options: from start, from failed jobs, or with SSH enabled for debugging.

  Common use cases:
  - Rerun a workflow from a failed job
  - Rerun a workflow from start
  - Rerun the last job with SSH enabled for debugging

WORKFLOW IDENTIFICATION (provide ONE):
- workflowId: The UUID of the workflow (e.g., "a12145c5-90f8-4cc9-98f2-36cb85db9e4b")
- workflowURL: Full workflow or job URL

RERUN OPTIONS (choose ONE strategy):

Strategy 1 - Rerun from failed (for recovery):
- fromFailed: true
- Reruns only the failed jobs and their dependencies
- Cannot be combined with: enableSsh

Strategy 2 - Rerun with SSH (for debugging):
- enableSsh: true
- Automatically reruns the LAST job in the workflow with SSH enabled
- Perfect for debugging flaky tests or investigating CI issues
- Cannot be combined with: fromFailed

Strategy 3 - Full workflow rerun (default):
- No additional parameters needed
- Reruns the entire workflow from the beginning

PARAMETER CONSTRAINTS:
- fromFailed CANNOT be used with enableSsh
  `,
  inputSchema: rerunWorkflowInputSchema,
};
