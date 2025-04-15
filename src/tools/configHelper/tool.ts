import { configHelperInputSchema } from './inputSchema.js';

export const configHelperTool = {
  name: 'config_helper' as const,
  description: `
  This tool helps analyze and validate CircleCI configuration files.

  Parameters:
  - params: An object containing:
    - configFile: string - The full contents of the CircleCI config file as a string. This should be the raw YAML content, not a file path.

  Example usage:
  {
    "params": {
      "configFile": "version: 2.1\norbs:\n  node: circleci/node@7\n..."
    }
  }

  Note: The configFile content should be provided as a properly escaped string with newlines represented as \n.
  `,
  inputSchema: configHelperInputSchema,
};
