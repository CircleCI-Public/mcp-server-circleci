import { CircleCIClients } from '../../clients/circleci/index.js';
import getJobLogs from '../getJobLogs.js';

const circleci = new CircleCIClients({
  token: process.env.CIRCLECI_TOKEN || '',
});

const getFlakyTests = async ({ projectSlug }: { projectSlug: string }) => {
  const flakyTests = await circleci.insights.getProjectFlakyTests({
    projectSlug,
  });

  if (!flakyTests || !flakyTests.flaky_tests) {
    throw new Error('Flaky tests not found');
  }

  const jobNumbers = flakyTests.flaky_tests.map((test) => test.job_number);

  return await getJobLogs({
    projectSlug,
    jobNumbers,
    failedStepsOnly: false,
  });
};

export default getFlakyTests;
