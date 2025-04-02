import { CircleCIClients } from '../../clients/circleci/index.js';
import { Pipeline } from '../../clients/schemas.js';
import { CircleCIPrivateClients } from '../../clients/circleci-private/index.js';

export type GetJobLogsParams = {
  projectSlug: string;
  branch?: string;
  pipelineNumber?: number; // if provided, always use this to fetch the pipeline instead of the branch
};

const circleci = new CircleCIClients({
  token: process.env.CIRCLECI_TOKEN || '',
});

const circleciPrivate = new CircleCIPrivateClients({
  token: process.env.CIRCLECI_TOKEN || '',
});

const getJobLogs = async ({
  projectSlug,
  branch,
  pipelineNumber,
}: GetJobLogsParams) => {
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

  const jobsDetails = await Promise.all(
    jobs.map(async (job) => {
      return await circleci.jobsV1.getJobDetails({
        projectSlug,
        jobNumber: job.job_number,
      });
    }),
  );

  const allLogs = await Promise.all(
    jobsDetails.map(async (job) => {
      // Get logs for all steps and their actions
      const stepLogs = await Promise.all(
        job.steps.flatMap((step) => {
          return step.actions
            .filter((action) => action.failed === true)
            .map(async (action) => {
              try {
                const logs = await circleciPrivate.jobs.getStepOutput({
                  projectSlug,
                  jobNumber: job.build_num,
                  taskIndex: action.index,
                  stepId: action.step,
                });
                return {
                  stepName: step.name,
                  logs,
                };
              } catch (error) {
                console.error('error in step', step.name, error);
                // Some steps might not have logs, return null in that case
                return null;
              }
            });
        }),
      );

      return {
        jobName: job.workflows.job_name,
        steps: stepLogs.filter(Boolean), // Remove any null entries
      };
    }),
  );

  return allLogs;
};

export default getJobLogs;
