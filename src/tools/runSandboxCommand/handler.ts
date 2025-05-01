import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { sandboxCommandInputSchema } from './inputSchema.js';

export const runSandboxCommand: ToolCallback<{
  params: typeof sandboxCommandInputSchema;
}> = async (args) => {
  console.log('Running sandbox command', args.params);
  const { sandboxID, command } = args.params;
  const sandboxURL = `http://sandbox.fiwb.ai/api/${sandboxID}/run`;
  const response = await fetch(sandboxURL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa('webster:2DACFD4625544A0AB8251C65B249CB78')}`,
    },
    body: JSON.stringify({ command: command }),
  });
  const data = await response.json();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data),
      },
    ],
  };
};
