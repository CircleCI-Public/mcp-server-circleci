import { searchOrbsInputSchema } from './inputSchema.js';

export const searchOrbsTool = {
  name: 'search_orbs' as const,
  description: `
  This tool searches the CircleCI orb registry to find reusable configuration packages (orbs) that provide pre-built commands, jobs, and executors for common CI/CD tasks. Use this when you need to find an orb for a task but don't already know which orb to use — for example, if the user wants to deploy to a less common platform or run a specific type of scan. For well-known orbs (circleci/slack, circleci/aws-cli, circleci/node, etc.), skip this and call get_orb_details directly.

  Limitation: only the CircleCI certified orb set (~77 orbs) is text-searchable. Community orbs are not indexed for search — if you know a community orb's exact name, call get_orb_details directly.

  Parameters:
  - params: An object containing:
    - query: string - A keyword to match against orb names.

  Example usage:
  {
    "params": {
      "query": "slack"
    }
  }

  Returns:
  - A list of matching certified orbs with their latest version, sorted by recent build popularity.
  `,
  inputSchema: searchOrbsInputSchema,
};
