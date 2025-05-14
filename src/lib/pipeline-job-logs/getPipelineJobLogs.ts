import { getCircleCIClient } from '../../clients/client.js';
import { Pipeline } from '../../clients/schemas.js';
import getJobLogs from './getJobLogs.js';

export type GetPipelineJobLogsParams = {
  projectSlug: string;
  branch?: string;
  pipelineNumber?: number; // if provided, always use this to fetch the pipeline instead of the branch
  jobNumber?: number; // if provided, always use this to fetch the job instead of the branch and pipeline number
};

const getPipelineJobLogs = async ({
  projectSlug,
  branch,
  pipelineNumber,
  jobNumber,
}: GetPipelineJobLogsParams) => {
  const circleci = getCircleCIClient();
  let pipeline: Pipeline | undefined;

  // If jobNumber is provided, fetch the job logs directly
  if (jobNumber) {
    return await getJobLogs({
      projectSlug,
      jobNumbers: [jobNumber],
      failedStepsOnly: true,
    });
  }
  // If pipelineNumber is provided, fetch the pipeline logs for failed steps in jobs
  if (pipelineNumber) {
    pipeline = await circleci.pipelines.getPipelineByNumber({
      projectSlug,
      pipelineNumber,
    });
  } else if (branch) {
    // If branch is provided, fetch the pipeline logs for failed steps in jobs for a branch
    const pipelines = await circleci.pipelines.getPipelines({
      projectSlug,
      branch,
    });

    pipeline = pipelines[0];
  } else {
    // If no jobNumber, pipelineNumber or branch is provided, throw an error
    throw new Error(
      'Either jobNumber, pipelineNumber or branch must be provided',
    );
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
