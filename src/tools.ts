import { CircleCIClients } from './clients/circleci/index.js';
import { getPipelineByCommit } from './clients/tools/getPipelineByCommit.js';
import {
  getBuildFailureOutputInputSchema,
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
    name: 'get_build_failure_output' as const,
    description: `
    <use_case>
      This tool retrieves build failure logs from CircleCI builds to provide context for debugging and fixing CI failures.
      
      Supported inputs:
      Direct URL inputs:
      - CircleCI job failure URL (e.g., "https://app.circleci.com/pipelines/$VCS/$ORGANIZATION/$REPO_NAME/$PIPELINE_NUMBER/workflows/$WORKFLOW_ID/jobs/$JOB_ID")
      - CircleCI pipeline failure URL (e.g., "https://app.circleci.com/pipelines/$VCS/$ORGANIZATION/$REPO_NAME/$PIPELINE_NUMBER")

      Auto-detection inputs:
      - Workspace root path (for repository-based detection)
      - Git remote URL (for project identification)
      - Git branch name (for finding relevant builds)

      The tool will:
      1. Attempt to locate the relevant build failure
      2. Extract failure logs and context
      3. Return formatted output suitable for debugging
    </use_case>

    <workflow>
      1. Input validation and processing:
        - If failure URLs provided: directly fetch logs
        - If workspace/git info provided: detect project and find recent failures
        - If insufficient info: request additional details

      2. Failure analysis:
        - Extract relevant error messages
        - Gather build context
        - Collect environment details
    </workflow>

    <important_notes>
      Priority order for failure detection:
      1. Direct failure URLs (most precise)
      2. Project detection via workspace
      3. Manual project lookup

      The tool requires AT LEAST ONE of:
      - A CircleCI job/pipeline failure URL
      - OR workspace root + git remote URL for project detection
    </important_notes>

    <example>
      Success case with URL:
      Input: failedJobURL = "https://app.circleci.com/pipelines/$VCS/$ORGANIZATION/$REPO_NAME/$PIPELINE_NUMBER/workflows/$WORKFLOW_ID/jobs/$JOB_ID"
      Output: Detailed failure logs and context

      Success case with workspace:
      Input: workspaceRoot = "/path/to/repo"
      Output: Most recent failure logs for detected project

      Insufficient info case:
      Input: No URLs or valid workspace
      Output: Request for failure URL or valid workspace path
    </example>

    <error_handling>
      The tool will handle these scenarios:
      1. Invalid URLs:
        - Return error requesting valid URL
        - Include URL validation details

      2. Project detection failures:
        - Return error explaining detection issue
        - Request direct failure URLs

      3. Permission issues:
        - Return error indicating access problem
        - Request appropriate credentials/tokens

      4. No recent failures:
        - Return message indicating no failures found
        - Include timeframe of search
    </error_handling>

    <next_steps>
      After receiving failure output, the agent should:
      1. Analyze the failure context
      2. Identify root cause
      3. Propose fixes based on error patterns
      4. Request additional context if needed
    </next_steps>

    <response_format>
      Tool response will include:
      - Failure type/category
      - Error messages
      - Build environment details
      - Relevant log snippets
      - Timestamp of failure
      - Build/job identifiers
    </response_format>
    `,
    inputSchema: getBuildFailureOutputInputSchema,
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
  get_build_failure_output: async (args: {
    params: {
      workspaceRoot?: string;
      gitRemoteURL?: string;
      branch?: string;
      failedPipelineURL?: string;
      failedJobURL?: string;
    };
  }) => {
    const {
      workspaceRoot,
      gitRemoteURL,
      branch,
      failedPipelineURL,
      failedJobURL,
    } = args.params;
    console.log(
      workspaceRoot,
      gitRemoteURL,
      branch,
      failedPipelineURL,
      failedJobURL,
    );
    return {
      content: [
        {
          type: 'text',
          text: `workspaceRoot: ${workspaceRoot}, gitRemoteURL: ${gitRemoteURL}, branch: ${branch}, failedPipelineURL: ${failedPipelineURL}, failedJobURL: ${failedJobURL}`,
        },
      ],
    };
  },
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
    return getPipelineByCommit(args);
  },
} satisfies ToolHandlers;
