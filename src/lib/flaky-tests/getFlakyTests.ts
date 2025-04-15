import { getCircleCIClient } from '../../clients/client.js';
import { Test } from '../../clients/schemas.js';

const getFlakyTests = async ({ projectSlug }: { projectSlug: string }) => {
  const circleci = getCircleCIClient();
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
  if (tests.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No flaky tests found' }],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: tests
          .map((test) => {
            const fields = [
              test.file && `File Name: ${test.file}`,
              test.classname && `Classname: ${test.classname}`,
              test.name && `Test name: ${test.name}`,
              test.result && `Result: ${test.result}`,
              test.run_time && `Run time: ${test.run_time}`,
              test.message && `Message: ${test.message}`,
            ].filter(Boolean);
            return `=====\n${fields.join('\n')}`;
          })
          .join('\n'),
      },
    ],
  };
};

export default getFlakyTests;
