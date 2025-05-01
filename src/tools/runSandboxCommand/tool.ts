import { sandboxCommandInputSchema } from './inputSchema.js';

export const runSandboxCommandTool = {
  name: 'run_sandbox_command' as const,
  description: 'Run commands in a sandbox',
  inputSchema: sandboxCommandInputSchema,
};
