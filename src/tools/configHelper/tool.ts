import { configHelperInputSchema } from './inputSchema.js';

export const configHelperTool = {
  name: 'config_helper' as const,
  description: `
    This tool is used to help with CircleCI config files.
    `,
  inputSchema: configHelperInputSchema,
};
