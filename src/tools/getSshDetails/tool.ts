import { getSshDetailsInputSchema } from './inputSchema.js';

export const getSshDetailsTool = {
  name: 'get_ssh_details' as const,
  description: `
  Gets SSH connection details for a job that was rerun with SSH enabled.

  Use this tool after rerunning a workflow with enableSsh: true.
  Wait 30-60 seconds after the rerun before calling this tool to allow the job to start.

WORKFLOW IDENTIFICATION (provide ONE):
- workflowId: The UUID of the workflow
- workflowURL: Full workflow URL from CircleCI

JOB SELECTION (optional):
- jobNumber: Specific job number to get SSH details for
- If omitted: Automatically finds the last job with SSH enabled in the workflow

RETURNS:
- SSH connection command (e.g., "ssh -p 54782 52.90.XXX.XXX")
- Job information (name, number, URL)
- Usage notes

COMMON ERRORS:
- "SSH step not found" → Job still starting, wait 30-60s and retry
- "No SSH-enabled jobs found" → Workflow not rerun with enableSsh: true

EXAMPLE WORKFLOW:
1. rerun_workflow(enableSsh: true) → Returns workflow URL
2. Wait 30-60 seconds
3. get_ssh_details(workflowURL: "...") → Returns SSH command
  `,
  inputSchema: getSshDetailsInputSchema,
};
