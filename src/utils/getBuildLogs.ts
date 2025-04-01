import { z } from 'zod';
import { CircleCIClients } from '../clients/circleci/index.js';
import { Pipeline } from '../clients/types.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

type Params = {
  projectSlug: string;
  branch: string;
  pipelineNumber?: number; // if provided, always use this to fetch the pipeline instead of the branch
};

const circleci = new CircleCIClients({
  token: process.env.CIRCLECI_TOKEN || '',
});

const getBuildLogs = async ({
  projectSlug,
  branch,
  pipelineNumber,
}: Params) => {
  let pipeline: Pipeline | undefined;

  if (pipelineNumber) {
    pipeline = await circleci.pipelines.getPipelineByNumber({
      projectSlug,
      pipelineNumber,
    });
  } else {
    const pipelines = await circleci.pipelines.getPipelinesByBranch({
      projectSlug,
      branch,
    });

    pipeline = pipelines[0];
  }

  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  const workflows = await circleci.workflows.getPipelineWorkflows({
    pipelineId: pipeline.id,
  });

  const jobs = (
    await Promise.all(
      workflows.map(async (workflow) => {
        return await circleci.jobs.getWorkflowJobs({
          workflowId: workflow.id,
        });
      }),
    )
  ).flat();

  // TODO: update to not use jobsV1, there's a better api for this
  const jobsDetails = await Promise.all(
    jobs.map(async (job) => {
      return await circleci.jobsV1.getJobDetails({
        projectSlug,
        jobNumber: job.job_number,
      });
    }),
  );

  // TODO: pull out just the useful pieces of jobDetails
  const job = jobsDetails[0];
  const stepId = job.steps[0].actions[0].step;
  const index = job.steps[0].actions[0].index;
  const logs = await circleci.jobsPrivate.getStepOutput({
    projectSlug,
    jobNumber: job.build_num,
    taskIndex: index,
    stepId,
  });
  return logs;
};

export default getBuildLogs;

export const getBuildLogsInputSchema = z.object({
  projectSlug: z.string(),
  branch: z.string(),
  pipelineNumber: z.number().optional(),
});

export const getBuildLogsTool = {
  name: 'get_build_logs' as const,
  description: 'Get the logs for a build',
  inputSchema: getBuildLogsInputSchema,
};

export const getBuildLogsToolFunction: ToolCallback<{
  params: typeof getBuildLogsInputSchema;
}> = async (args) => {
  const { projectSlug, branch, pipelineNumber } = args.params;
  const logs = await getBuildLogs({
    projectSlug,
    branch,
    pipelineNumber,
  });
  return {
    content: [
      {
        type: 'text' as const,
        text: logs.output,
      },
      {
        type: 'text' as const,
        text: logs.error,
      },
    ],
  };
};
