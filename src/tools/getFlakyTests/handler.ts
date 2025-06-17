import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getFlakyTestLogsInputSchema } from './inputSchema.js';
import getFlakyTests, {
  formatFlakyTests,
} from '../../lib/flaky-tests/getFlakyTests.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Test } from '../../clients/schemas.js';

export const useFileOutputDirectory = './flaky-tests-output';

export const getFlakyTestLogs: ToolCallback<{
  params: typeof getFlakyTestLogsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    projectURL,
    projectSlug: inputProjectSlug,
  } = args.params;

  let projectSlug: string | null | undefined;

  if (inputProjectSlug) {
    projectSlug = inputProjectSlug;
  } else if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL) {
    projectSlug = await identifyProjectSlug({
      gitRemoteURL,
    });
  } else {
    return mcpErrorOutput(
      'Missing required inputs. Please provide either: 1) projectSlug, 2) projectURL, or 3) workspaceRoot with gitRemoteURL.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput(`
          Project not found. Ask the user to provide the inputs user can provide based on the tool description.

          Project slug: ${projectSlug}
          Git remote URL: ${gitRemoteURL}
          `);
  }

  const tests = await getFlakyTests({
    projectSlug,
  });

  if (process.env.USE_FILE_OUTPUT === 'true') {
    try {
      return await writeTestsToFiles({ tests });
    } catch (error) {
      console.error(error);
      return formatFlakyTests(tests);
    }
  }

  return formatFlakyTests(tests);
};

const generateSafeFilename = ({
  test,
  index,
}: {
  test: Test;
  index: number;
}): string => {
  const safeTestName = (test.name || 'unnamed-test')
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 50); // Limit length

  return `flaky-test-${index + 1}-${safeTestName}.txt`;
};

/**
 * Write test data to a file
 */
const writeTestToFile = ({
  test,
  filePath,
  index,
}: {
  test: Test;
  filePath: string;
  index: number;
}): void => {
  const testContent = [
    `Flaky Test #${index + 1}`,
    '='.repeat(50),
    test.file && `File Name: ${test.file}`,
    test.classname && `Classname: ${test.classname}`,
    test.name && `Test name: ${test.name}`,
    test.result && `Result: ${test.result}`,
    test.run_time && `Run time: ${test.run_time}`,
    test.message && `Message: ${test.message}`,
    '',
    'Raw Test Data:',
    '-'.repeat(20),
    JSON.stringify(test, null, 2),
  ]
    .filter(Boolean)
    .join('\n');

  writeFileSync(filePath, testContent, 'utf8');
};

/**
 * Write flaky tests to individual files
 * @param params Configuration parameters
 * @param params.tests Array of test objects to write to files
 * @returns Response object with success message or error
 */
const writeTestsToFiles = async ({
  tests,
}: {
  tests: Test[];
}): Promise<{
  content: {
    type: 'text';
    text: string;
  }[];
}> => {
  if (tests.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No flaky tests found - no files created',
        },
      ],
    };
  }

  try {
    // Create directory recursively
    const { mkdirSync } = await import('fs');
    mkdirSync(useFileOutputDirectory, { recursive: true });
  } catch (error) {
    return mcpErrorOutput(
      `Failed to create output directory: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const filePaths: string[] = [];

  try {
    tests.forEach((test, index) => {
      const filename = generateSafeFilename({ test, index });
      const filePath = join(useFileOutputDirectory, filename);

      writeTestToFile({ test, filePath, index });
      filePaths.push(filePath);
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${tests.length} flaky tests that need stabilization. Each file contains test failure data and metadata - analyze these reports to understand what's causing the flakiness, then locate and fix the actual test code.\n\nFocus on identifying:\n- Timing issues (race conditions, insufficient waits)\n- Environment dependencies (network, external services)\n- Test isolation problems (shared state, cleanup issues)\n- Non-deterministic assertions\n\nFlaky test reports:\n${filePaths.map((path) => `- ${path}`).join('\n')}\n\nFiles are located in: ${useFileOutputDirectory}`,
        },
      ],
    };
  } catch (error) {
    return mcpErrorOutput(
      `Failed to write flaky test files: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
