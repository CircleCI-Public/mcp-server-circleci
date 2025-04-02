import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { testJobLogsInputSchema } from './inputSchema.js';
import getJobLogs from '../../lib/job-logs/getJobLogs.js';

export const testJobLogs: ToolCallback<{
  params: typeof testJobLogsInputSchema;
}> = async (args) => {
  const { branch, pipelineNumber } = args.params;
  const logs = await getJobLogs({
    projectSlug: 'gh/CircleCI-Public/hungry-panda',
    branch,
    pipelineNumber,
  });

  // Process logs into an array of strings
  const logStrings = logs.map((log) => {
    return (
      log.jobName +
      '\n' +
      log.jobNumber +
      '\n' +
      log.steps.map((step) => step?.stepName + '\n' + step?.logs).join('\n')
    );
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: logStrings.join('\n'),
      },
    ],
  };
};
