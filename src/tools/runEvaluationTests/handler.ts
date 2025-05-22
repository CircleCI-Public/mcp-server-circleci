import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import fs from 'fs';
import { runEvaluationTestsInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const runEvaluationTests: ToolCallback<{
  params: typeof runEvaluationTestsInputSchema;
}> = async (args) => {
  const { projectSlug, tests } = args.params;

  if (!tests) {
    return mcpErrorOutput('Missing required input: tests');
  }

  if (!projectSlug) {
    return mcpErrorOutput('Missing required input: projectSlug');
  }

  fs.writeFileSync('tests.json', JSON.stringify(tests, null, 2));

  return {
    content: [
      {
        type: 'text',
        text: `Received projectSlug: ${projectSlug}

NEXT STEP:
- Run a pipeline with the following configuration:
\`\`\`
version: 2.1

jobs:
  hello-job:
    docker:
      - image: cimg/node:17.2.0 # the primary container, where your job's commands are run
    steps:
      - checkout # check out the code in the project directory
      - run: echo "hello world" # run the 'echo' command

workflows:
  my-workflow-from-mcp:
    jobs:
      - hello-job
\`\`\`
`,
      },
    ],
  };
};
