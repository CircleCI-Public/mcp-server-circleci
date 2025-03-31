import { CircleCIClients } from '../clients/circleci/index.js';
import { Pipeline } from '../clients/types.js';

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
  return jobsDetails;
};

export default getBuildLogs;
