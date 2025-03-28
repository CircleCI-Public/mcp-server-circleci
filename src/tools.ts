import { CircleCIClients } from './clients/circleci/index.js';
import {
  getPipelineByCommitInputSchema,
  getPipelineInputSchema,
  nodeVersionInputSchema,
} from './toolsSchema.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';

// Define the tools with their configurations
export const CCI_TOOLS = [
  {
    name: '__node_version' as const,
    description: `Get the Node.js version used by the MCP server`,
    inputSchema: nodeVersionInputSchema,
  },
  {
    name: 'get_pipeline' as const,
    description: `Get a pipeline by projectSlug`,
    inputSchema: getPipelineInputSchema,
  },
  {
    name: 'get_pipeline_by_commit' as const,
    description: `Get a pipeline by projectSlug and commit`,
    inputSchema: getPipelineByCommitInputSchema,
  },
];

// Extract the tool names as a union type
type CCIToolName = (typeof CCI_TOOLS)[number]['name'];

export type ToolHandler<T extends CCIToolName> = ToolCallback<{
  params: Extract<(typeof CCI_TOOLS)[number], { name: T }>['inputSchema'];
}>;

// Create a type for the tool handlers that directly maps each tool to its appropriate input schema
type ToolHandlers = {
  [K in CCIToolName]: ToolHandler<K>;
};

const circleci = new CircleCIClients(process.env.CIRCLECI_TOKEN ?? '');

export const CCI_HANDLERS = {
  // for debugging reasons.
  __node_version: () => ({
    content: [{ type: 'text', text: process.version }],
  }),
  get_pipeline: async (args: { params: { projectSlug: string } }) => {
    const { projectSlug } = args.params;
    const pipeline = await circleci.pipelines.getRecentPipelines({
      projectSlug,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(pipeline) }],
    };
  },
  get_pipeline_by_commit: async (args: {
    params: { projectSlug: string; commit: string; branch: string };
  }) => {
    const { projectSlug, commit, branch } = args.params;
    const pipeline = await circleci.pipelines.getPipelineByCommit({
      projectSlug,
      branch,
      commit,
    });
    const returnText = pipeline
      ? `Pipeline ID: ${pipeline.id}\nBranch: ${branch}\nCommit: ${commit}`
      : 'no pipeline found';
    return {
      content: [{ type: 'text', text: returnText }],
    };
  },
} satisfies ToolHandlers;
