import { CircleCIClients } from '../../clients/circleci/index.js';

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

  const testsPromises = jobNumbers.map(async (jobNumber) => {
    const tests = await circleci.tests.getJobTests({
      projectSlug,
      jobNumber,
    });
    return tests;
  });

  const testsArrays = await Promise.all(testsPromises);

  return testsArrays.flat();
};

export default getFlakyTests;
