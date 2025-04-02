import { testJobLogsInputSchema } from './inputSchema.js';

export const testJobLogsTool = {
  name: 'test_job_logs' as const,
  description: `testing
    `,
  inputSchema: testJobLogsInputSchema,
};
