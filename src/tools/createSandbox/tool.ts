import { createSandboxInputSchema } from './inputSchema.js';

export const createSandboxTool = {
  name: 'create_sandbox' as const,
  description: 'Create a virtual machine to run code',
  inputSchema: createSandboxInputSchema,
};
