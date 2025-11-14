import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rerunWorkflowInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getAppURL } from '../../clients/circleci/index.js';
import { getWorkflowIdFromURL } from '../../lib/getWorkflowIdFromURL.js';

export const rerunWorkflow: ToolCallback<{
  params: typeof rerunWorkflowInputSchema;
}> = async (args) => {
  let { workflowId } = args.params ?? {};
  const { fromFailed, workflowURL, enableSsh } = args.params ?? {};
  const baseURL = getAppURL();
  const circleci = getCircleCIClient();

  if (workflowURL) {
    workflowId = getWorkflowIdFromURL(workflowURL);
  }

  if (!workflowId) {
    return mcpErrorOutput(
      'workflowId is required and could not be determined from workflowURL.',
    );
  }

  // Validate parameter constraints
  if (enableSsh && fromFailed) {
    return mcpErrorOutput(
      'enableSsh and fromFailed cannot be used together. Use enableSsh to debug a specific job, or use fromFailed to rerun all failed jobs.',
    );
  }

  const workflow = await circleci.workflows.getWorkflow({
    workflowId,
  });

  if (!workflow) {
    return mcpErrorOutput('Workflow not found');
  }

  const workflowFailed = workflow?.status?.toLowerCase() === 'failed';

  if (fromFailed && !workflowFailed) {
    return mcpErrorOutput('Workflow is not failed, cannot rerun from failed');
  }

  // Auto-fetch last job when SSH is enabled
  let jobs: string[] | undefined;
  if (enableSsh) {
    const workflowJobs = await circleci.jobs.getWorkflowJobs({ workflowId });

    if (workflowJobs.length === 0) {
      return mcpErrorOutput('No jobs found in workflow');
    }

    // Get the last job (most recent)
    const lastJob = workflowJobs[workflowJobs.length - 1];
    jobs = [lastJob.id];
  }

  const newWorkflow = await circleci.workflows.rerunWorkflow({
    workflowId,
    fromFailed: fromFailed !== undefined ? fromFailed : jobs ? undefined : workflowFailed,
    enableSsh,
    jobs,
  });

  const workflowUrl = `${baseURL}/pipelines/workflows/${newWorkflow.workflow_id}`;
  return {
    content: [
      {
        type: 'text',
        text: `New workflowId is ${newWorkflow.workflow_id} and [View Workflow in CircleCI](${workflowUrl})`,
      },
    ],
  };
};
