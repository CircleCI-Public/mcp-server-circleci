import { getCircleCIClient } from '../../clients/client.js';
import { Test } from '../../clients/schemas.js';
import { rateLimitedRequests } from '../rateLimitedRequests/index.js';
import outputTextTruncated, { SEPARATOR } from '../outputTextTruncated.js';

const getFlakyTests = async ({ projectSlug }: { projectSlug: string }) => {
  const circleci = getCircleCIClient();
  const flakyTests = await circleci.insights.getProjectFlakyTests({
    projectSlug,
  });

  if (!flakyTests || !flakyTests.flaky_tests) {
    throw new Error('Flaky tests not found');
  }

  const jobNumbers = [
    ...new Set(flakyTests.flaky_tests.map((test) => test.job_number)),
  ];

  const testsArrays = await rateLimitedRequests(
    jobNumbers.map((jobNumber) => async () => {
      try {
        const tests = await circleci.tests.getJobTests({
          projectSlug,
          jobNumber,
        });
        return tests;
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          console.error(`Job ${jobNumber} not found:`, error);
          return [];
        } else if (error instanceof Error && error.message.includes('429')) {
          console.error(`Rate limited for job request ${jobNumber}:`, error);
          return [];
        }
        throw error;
      }
    }),
  );

  return testsArrays.flat().filter((test) => test.result === 'failure');
};

export const formatFlakyTests = (tests: Test[]) => {
  if (tests.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No flaky tests found' }],
    };
  }

  const outputText = tests
    .map((test) => {
      const fields = [
        test.file && `File Name: ${test.file}`,
        test.classname && `Classname: ${test.classname}`,
        test.name && `Test name: ${test.name}`,
        test.result && `Result: ${test.result}`,
        test.run_time && `Run time: ${test.run_time}`,
        test.message && `Message: ${test.message}`,
      ].filter(Boolean);
      return `${SEPARATOR}${fields.join('\n')}`;
    })
    .join('\n');

  return outputTextTruncated(outputText);
};

export default getFlakyTests;
