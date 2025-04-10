import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

import { workflowPerformanceAnalyzerInputSchema } from './ischema.js';

export const buildDoctor: ToolCallback<{
  params: typeof workflowPerformanceAnalyzerInputSchema;
}> = async () => {
  throw new Error('Not implemented');
  // return {
  //   content: [
  //     {
  //       type: 'text' as const,
  //       text: 'Build Doctor',
  //     },
  //   ],
  // };
};
