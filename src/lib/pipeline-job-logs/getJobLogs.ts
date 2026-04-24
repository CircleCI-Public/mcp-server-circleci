import { getCircleCIPrivateClient } from '../../clients/client.js';
import { getCircleCIClient } from '../../clients/client.js';
import { rateLimitedRequests } from '../rateLimitedRequests/index.js';
import { JobDetails } from '../../clients/schemas.js';
import outputTextTruncated, { SEPARATOR } from '../outputTextTruncated.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
  const circleci = getCircleCIClient();
  const circleciPrivate = getCircleCIPrivateClient();

  const jobsDetails = (
    await rateLimitedRequests(
      jobNumbers.map((jobNumber) => async () => {
        try {
          return await circleci.jobsV1.getJobDetails({
            projectSlug,
            jobNumber,
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes('404')) {
            console.error(`Job ${jobNumber} not found:`, error);
            // some jobs might not be found, return null in that case
            return null;
          } else if (error instanceof Error && error.message.includes('429')) {
            console.error(`Rate limited for job request ${jobNumber}:`, error);
            // some requests might be rate limited, return null in that case
            return null;
          }
          throw error;
        }
      }),
    )
  ).filter((job): job is JobDetails => job !== null);

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

function resolveOutputDir(outputDir: string): string {
  if (outputDir.startsWith('~')) {
    return path.join(os.homedir(), outputDir.slice(1));
  }
  if (outputDir.includes('%USERPROFILE%')) {
    const userProfile = process.env.USERPROFILE || os.homedir();
    return outputDir.replace('%USERPROFILE%', userProfile);
  }
  return outputDir;
}

/**
 * Formats job logs, either writing to a file (if outputDir provided) or returning truncated inline text
 * @param jobStepLogs Array of job logs containing step information
 * @param outputDir Optional directory to write the full log file to
 * @returns Formatted output object with file path or inline (possibly truncated) text
 */
export function formatJobLogs(
  jobStepLogs: JobWithStepLogs[],
  outputDir?: string,
) {
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
  const outputText = jobStepLogs
    .map((log) => `${SEPARATOR}Job: ${log.jobName}\n` + formatSteps(log))
    .join('\n');

  if (outputDir) {
    const resolvedDir = path.resolve(resolveOutputDir(outputDir));
    fs.mkdirSync(resolvedDir, { recursive: true });
    const fileName = `circleci-build-logs-${Date.now()}.txt`;
    const filePath = path.join(resolvedDir, fileName);
    fs.writeFileSync(filePath, outputText, 'utf8');
    return {
      content: [
        {
          type: 'text' as const,
          text: `Build logs saved to: ${filePath}`,
        },
      ],
    };
  }

  return outputTextTruncated(outputText);
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
