import { commitConfigInputSchema } from './inputSchema.js';

export const commitConfigTool = {
  name: 'commit_config' as const,
  description: `
  This tool commits the CircleCI config file to the repository.

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

  Tool output instructions:
    - If the config is valid, the tool will return a success message.
    - If the config is invalid, the tool will return an error message.
  `,
  inputSchema: commitConfigInputSchema,
};
