import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createSandboxInputSchema } from './inputSchema.js';

const sandboxURL = 'http://sandbox.fiwb.ai/api/create';

export const createSandbox: ToolCallback<{
  params: typeof createSandboxInputSchema;
}> = async (args) => {
  const response = await fetch(sandboxURL, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa('webster:2DACFD4625544A0AB8251C65B249CB78')}`,
    },
  });
  const data = await response.json();
  return {
    content: [
      {
        type: 'text' as const,
        text: data['ID'],
      },
    ],
  };
};
