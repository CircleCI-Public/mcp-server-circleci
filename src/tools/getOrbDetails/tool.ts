import { getOrbDetailsInputSchema } from './inputSchema.js';

export const getOrbDetailsTool = {
  name: 'get_orb_details' as const,
  description: `
  This tool retrieves the complete schema for a specific CircleCI orb, including all commands, jobs, executors, and their parameters (names, types, defaults, whether required), plus the current latest version. Use this tool whenever you need to write or modify CircleCI config that uses an orb — it gives you the exact parameter names and types so you can generate correct YAML instead of guessing from training data. Accepts an orb slug like "circleci/slack@4.12.6" for a specific version, or "circleci/slack" to get the latest version's schema.

  Parameters:
  - params: An object containing:
    - orbSlug: string - The orb identifier in the form "namespace/name" or "namespace/name@version".

  Example usage:
  {
    "params": {
      "orbSlug": "circleci/slack"
    }
  }

  Returns:
  - The orb's latest (or requested) version number and its full schema: commands, jobs, executors, and parameters with types, defaults, and required/optional status.
  `,
  inputSchema: getOrbDetailsInputSchema,
};
