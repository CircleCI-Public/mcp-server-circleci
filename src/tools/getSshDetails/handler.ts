import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSshDetailsInputSchema } from './inputSchema.js';
import { getCircleCIClient, getCircleCIPrivateClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getAppURL } from '../../clients/circleci/index.js';
import { getWorkflowIdFromURL } from '../../lib/getWorkflowIdFromURL.js';

// Helper to extract SSH command from step output
function extractSshCommand(output: string): string {
  // Example output: "You can now SSH into this box...\n    $ ssh -p 54782 52.90.XXX.XXX"
  const sshMatch = output.match(/\$\s*(ssh\s+[^\n]+)/);
  if (sshMatch) {
    return sshMatch[1].trim();
  }
  // Fallback: look for just the ssh command pattern
  const directMatch = output.match(/(ssh\s+-p\s+\d+\s+[\d.]+)/);
  if (directMatch) {
    return directMatch[1].trim();
  }
  return output.trim();
}

export const getSshDetails: ToolCallback<{
  params: typeof getSshDetailsInputSchema;
}> = async (args) => {
  let { workflowId } = args.params ?? {};
  const { jobNumber, workflowURL } = args.params ?? {};
  const baseURL = getAppURL();
  const circleci = getCircleCIClient();
  const circleciPrivate = getCircleCIPrivateClient();

  // Extract workflow ID from URL if provided
  if (workflowURL) {
    workflowId = getWorkflowIdFromURL(workflowURL);
  }

  if (!workflowId) {
    return mcpErrorOutput(
      'workflowId is required and could not be determined from workflowURL.',
    );
  }

  try {
    // Get workflow to get project slug
    const workflow = await circleci.workflows.getWorkflow({ workflowId });
    if (!workflow) {
      return mcpErrorOutput('Workflow not found.');
    }
    const projectSlug = workflow.project_slug;

    // Get all jobs for the workflow
    const workflowJobs = await circleci.jobs.getWorkflowJobs({ workflowId });

    if (workflowJobs.length === 0) {
      return mcpErrorOutput('No jobs found in this workflow.');
    }

    let targetJob = null;

    // If job number provided, find that specific job
    if (jobNumber !== undefined) {
      targetJob = workflowJobs.find((job) => job.job_number === jobNumber);
      if (!targetJob) {
        return mcpErrorOutput(
          `Job number ${jobNumber} not found in this workflow. Available jobs: ${workflowJobs.map((j) => j.job_number).join(', ')}`,
        );
      }
    } else {
      // Find the last job with SSH enabled
      // Iterate from last to first
      for (let i = workflowJobs.length - 1; i >= 0; i--) {
        const job = workflowJobs[i];
        if (!job.job_number) continue;

        try {
          const jobDetails = await circleci.jobsV1.getJobDetails({
            projectSlug,
            jobNumber: job.job_number,
          });

          // Check if this job has an "Enable SSH" step
          const sshStep = jobDetails.steps?.find((step) =>
            step.name.toLowerCase().includes('enable ssh'),
          );

          if (sshStep && sshStep.actions && sshStep.actions.length > 0) {
            targetJob = job;
            break;
          }
        } catch {
          // Job might not be ready yet, continue to next
          continue;
        }
      }

      if (!targetJob) {
        return {
          content: [
            {
              type: 'text',
              text: `No SSH-enabled jobs found in this workflow.

Make sure you rerun the workflow with enableSsh: true.
Or provide a specific jobNumber if you know which job has SSH enabled.

The job may still be starting. If you just rerun the workflow, wait 30-60 seconds and try again.`,
            },
          ],
        };
      }
    }

    // At this point we have targetJob
    if (!targetJob.job_number) {
      return mcpErrorOutput('Job number not available for the selected job.');
    }

    // Get job details
    const jobDetails = await circleci.jobsV1.getJobDetails({
      projectSlug,
      jobNumber: targetJob.job_number,
    });

    // Find the "Enable SSH" step
    const sshStep = jobDetails.steps?.find((step) =>
      step.name.toLowerCase().includes('enable ssh'),
    );

    if (!sshStep || !sshStep.actions || sshStep.actions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `SSH step not found for job ${targetJob.job_number}. The job may still be starting.

Please wait 30-60 seconds and try again.

If the problem persists, check that the job was rerun with SSH enabled.`,
          },
        ],
      };
    }

    // Get the first action of the SSH step
    const sshAction = sshStep.actions[0];

    // Fetch step output
    const stepOutput = await circleciPrivate.jobs.getStepOutput({
      projectSlug,
      jobNumber: jobDetails.build_num,
      taskIndex: sshAction.index,
      stepId: sshAction.step,
    });

    // Extract SSH command
    const sshCommand = extractSshCommand(stepOutput.output);
    const jobUrl = `${baseURL}/pipelines/jobs/${targetJob.job_number}`;
    const jobName = jobDetails.workflows?.job_name || 'unknown';

    return {
      content: [
        {
          type: 'text',
          text: `SSH Connection Details:

$ ${sshCommand}

Job: ${jobName} (#${targetJob.job_number})
View: ${jobUrl}

Note: SSH session active for 10 minutes after job completion.
Your SSH key must be added to CircleCI account settings.`,
        },
      ],
    };
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      return {
        content: [
          {
            type: 'text',
            text: `Job not found or not ready yet.

The workflow may have just been rerun. Please wait 30-60 seconds for the job to start and try again.`,
          },
        ],
      };
    }
    throw error;
  }
};
