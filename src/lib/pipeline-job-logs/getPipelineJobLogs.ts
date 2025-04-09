import { CircleCIClients } from '../../clients/circleci/index.js';
import { Pipeline } from '../../clients/schemas.js';
import getJobLogs from './getJobLogs.js';

export type GetPipelineJobLogsParams = {
  projectSlug: string;
  branch?: string;
  pipelineNumber?: number; // if provided, always use this to fetch the pipeline instead of the branch
};

const getPipelineJobLogs = async ({
  projectSlug,
  branch,
  pipelineNumber,
}: GetPipelineJobLogsParams) => {
  const circleci = new CircleCIClients({
    token: process.env.CIRCLECI_TOKEN || '',
  });
  let pipeline: Pipeline | undefined;

  if (pipelineNumber) {
    pipeline = await circleci.pipelines.getPipelineByNumber({
      projectSlug,
      pipelineNumber,
    });
  } else if (branch) {
    const pipelines = await circleci.pipelines.getPipelinesByBranch({
      projectSlug,
      branch,
    });

    pipeline = pipelines[0];
  } else {
    throw new Error('Either pipelineNumber or branch must be provided');
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

  const jobNumbers = jobs
    .filter(
      (job): job is typeof job & { job_number: number } =>
        job.job_number != null,
    )
    .map((job) => job.job_number);

  return await getJobLogs({
    projectSlug,
    jobNumbers,
    failedStepsOnly: true,
  });
};

export default getPipelineJobLogs;
