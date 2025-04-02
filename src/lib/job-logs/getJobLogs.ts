import { z } from 'zod';
import { CircleCIClients } from '../../clients/circleci/index.js';
import { Pipeline } from '../../clients/schemas.js';
import { CircleCIPrivateClients } from '../../clients/circleci-private/index.js';
type Params = {
  projectSlug: string;
  branch: string;
  pipelineNumber?: number; // if provided, always use this to fetch the pipeline instead of the branch
};

const circleci = new CircleCIClients({
  token: process.env.CIRCLECI_TOKEN || '',
});

const circleciPrivate = new CircleCIPrivateClients({
  token: process.env.CIRCLECI_TOKEN || '',
});

const getJobLogs = async ({ projectSlug, branch, pipelineNumber }: Params) => {
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

  // console.error('pipelineid', pipeline.id);

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
        jobNumber: job.job_number, // TODO: temp
      });
    }),
  );

  // console.error(
  //   'jobsDetails steps',
  //   JSON.stringify(jobsDetails[0].steps, null, 2),
  // );

  // const tempJobDetails = [jobsDetails[0]]; // TODO: remove this, just for testing

  // console.error('jobsDetails', jobsDetails);

  const allLogs = await Promise.all(
    jobsDetails.map(async (job) => {
      // Get logs for all steps and their actions
      const stepLogs = await Promise.all(
        job.steps.flatMap((step) => {
          console.error('mapping over step', step.name);
          return step.actions.map(async (action) => {
            console.error('before try catch in step', step.name);
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
        jobNumber: job.build_num,
        jobName: job.job_name,
        steps: stepLogs.filter(Boolean), // Remove any null entries
      };
    }),
  );

  // console.error('allLogs', allLogs);

  // Example of an item in allLogs:
  // {
  //   jobNumber: 123,
  //   jobName: "test-and-build",
  //   steps: [
  //     {
  //       stepName: "Run Tests",
  //       logs: {
  //         output: "Installing dependencies...\nRunning tests...\nAll tests passed!",
  //         error: "Warning: deprecated package detected"
  //       }
  //     },
  //     {
  //       stepName: "Build",
  //       logs: {
  //         output: "Building project...\nBuild successful",
  //         error: ""
  //       }
  //     }
  //   ]
  // }
  return allLogs;
};

export default getJobLogs;
