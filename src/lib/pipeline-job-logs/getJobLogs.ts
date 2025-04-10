import { CircleCIPrivateClients } from '../../clients/circleci-private/index.js';
import { CircleCIClients } from '../../clients/circleci/index.js';

export type GetJobLogsParams = {
  projectSlug: string;
  jobNumbers: number[];
  failedStepsOnly?: boolean;
};

type StepLog = {
  stepName: string;
  logs: {
    output: string;
    error: string;
  };
};

type JobWithStepLogs = {
  jobName: string;
  steps: (StepLog | null)[];
};

/**
 * Retrieves job logs from CircleCI
 * @param params Object containing project slug, job numbers, and optional flag to filter for failed steps only
 * @param params.projectSlug The slug of the project to retrieve logs for
 * @param params.jobNumbers The numbers of the jobs to retrieve logs for
 * @param params.failedStepsOnly Whether to filter for failed steps only
 * @returns Array of job logs with step information
 */
const getJobLogs = async ({
  projectSlug,
  jobNumbers,
  failedStepsOnly = true,
}: GetJobLogsParams): Promise<JobWithStepLogs[]> => {
  const circleci = new CircleCIClients({
    token: process.env.CIRCLECI_TOKEN || '',
  });

  const circleciPrivate = new CircleCIPrivateClients({
    token: process.env.CIRCLECI_TOKEN || '',
  });

  const jobsDetails = await Promise.all(
    jobNumbers.map(async (jobNumber) => {
      return await circleci.jobsV1.getJobDetails({
        projectSlug,
        jobNumber,
      });
    }),
  );

  const allLogs = await Promise.all(
    jobsDetails.map(async (job) => {
      // Get logs for all steps and their actions
      const stepLogs = await Promise.all(
        job.steps.flatMap((step) => {
          let actions = step.actions;
          if (failedStepsOnly) {
            actions = actions.filter((action) => action.failed === true);
          }
          return actions.map(async (action) => {
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

/**
 * Formats job logs into a standardized output structure
 * @param logs Array of job logs containing step information
 * @returns Formatted output object with text content
 */
export function formatJobLogs(jobStepLogs: JobWithStepLogs[]) {
  if (jobStepLogs.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No logs found.',
        },
      ],
    };
  }
  return {
    content: [
      {
        type: 'text' as const,
        text: jobStepLogs
          .map((log) => `=====\nJob: ${log.jobName}\n` + formatSteps(log))
          .join('\n'),
      },
    ],
  };
}

const formatSteps = (jobStepLog: JobWithStepLogs) => {
  if (jobStepLog.steps.length === 0) {
    return 'No steps found.';
  }
  return jobStepLog.steps
    .map(
      (step) =>
        `Step: ${step?.stepName}\n` + `Logs: ${JSON.stringify(step?.logs)}`,
    )
    .join('\n');
};
