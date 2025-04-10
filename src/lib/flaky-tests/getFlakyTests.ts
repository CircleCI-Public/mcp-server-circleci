import { CircleCIClients } from '../../clients/circleci/index.js';
import { Test } from '../../clients/schemas.js';

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

  return testsArrays.flat().filter((test) => test.result === 'failure');
};

export const formatFlakyTests = (tests: Test[]) => {
  return {
    content: [
      {
        type: 'text' as const,
        text: tests
          .map(
            (test) =>
              `=====\nTest name: ${test.name}\nResult: ${test.result}\nRun time: ${test.run_time}\nMessage: ${test.message}`,
          )
          .join('\n'),
      },
    ],
  };
};

export default getFlakyTests;
