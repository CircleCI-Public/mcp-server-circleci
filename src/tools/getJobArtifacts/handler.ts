import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getJobArtifactsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import {
  getProjectSlugFromURL,
  getJobNumberFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

export const getJobArtifacts: ToolCallback<{
  params: typeof getJobArtifactsInputSchema;
}> = async (args) => {
  const {
    projectSlug: inputProjectSlug,
    branch: inputBranch,
    jobNumber: inputJobNumber,
    jobURL,
    workspaceRoot,
    gitRemoteURL,
    artifactPath,
  } = args.params;

  let projectSlug: string;
  let jobNumber: number;
  let branch = inputBranch;

  // Determine project slug and job number based on input method
  if (inputProjectSlug && inputJobNumber) {
    // Option 1: Direct project slug and job number
    if (!inputBranch) {
      return mcpErrorOutput(
        'Branch is required when using projectSlug. Please provide the branch parameter.',
      );
    }
    projectSlug = inputProjectSlug;
    jobNumber = inputJobNumber;
  } else if (jobURL) {
    // Option 2: Extract from job URL
    const slugFromURL = getProjectSlugFromURL(jobURL);
    const jobNumberFromURL = getJobNumberFromURL(jobURL);

    if (!slugFromURL) {
      return mcpErrorOutput(
        'Failed to extract project information from the provided job URL. Please check the URL format.',
      );
    }

    if (!jobNumberFromURL) {
      return mcpErrorOutput(
        'Failed to extract job number from the provided job URL. Please check the URL format.',
      );
    }

    projectSlug = slugFromURL;
    jobNumber = jobNumberFromURL;
  } else if (workspaceRoot && inputJobNumber) {
    // Option 3: Workspace detection
    if (!gitRemoteURL) {
      return mcpErrorOutput(
        'Git remote URL is required when using workspace detection. Please provide the gitRemoteURL parameter.',
      );
    }

    const detectedSlug = await identifyProjectSlug({ gitRemoteURL });
    if (!detectedSlug) {
      return mcpErrorOutput(
        'Failed to identify project from git remote URL. Please check the URL format.',
      );
    }
    projectSlug = detectedSlug;
    jobNumber = inputJobNumber;

    if (!branch) {
      branch = 'main';
    }
  } else {
    return mcpErrorOutput(
      'Invalid input combination. Please provide either:\n' +
        '1. projectSlug + branch + jobNumber\n' +
        '2. jobURL\n' +
        '3. workspaceRoot + gitRemoteURL + jobNumber',
    );
  }

  try {
    // Get CircleCI client
    const circleci = getCircleCIClient();

    // Fetch artifacts for the job
    const artifacts = await circleci.artifacts.getAllJobArtifacts(
      projectSlug,
      jobNumber,
    );

    // Filter artifacts if path filter is provided
    let filteredArtifacts = artifacts;
    if (artifactPath) {
      filteredArtifacts = artifacts.filter((artifact) =>
        artifact.path.startsWith(artifactPath),
      );
    }

    // Format output
    if (filteredArtifacts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: artifactPath
              ? `No artifacts found matching path prefix "${artifactPath}" for job #${jobNumber}`
              : `No artifacts found for job #${jobNumber}`,
          },
        ],
      };
    }

    // Create formatted output
    const output = [
      `# Artifacts for Job #${jobNumber}`,
      `Project: ${projectSlug}`,
      branch ? `Branch: ${branch}` : '',
      artifactPath ? `Filter: ${artifactPath}` : '',
      '',
      `Found ${filteredArtifacts.length} artifact${filteredArtifacts.length === 1 ? '' : 's'}:`,
      '',
    ]
      .filter(Boolean)
      .join('\n');

    // Add artifact details
    const artifactDetails = filteredArtifacts
      .map((artifact, index) => {
        return [
          `## ${index + 1}. ${artifact.path}`,
          `   Node: ${artifact.node_index}`,
          `   URL: ${artifact.url}`,
        ].join('\n');
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: output + artifactDetails,
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return mcpErrorOutput(
      `Failed to fetch artifacts: ${errorMessage}\n\n` +
        'Please ensure:\n' +
        '1. The job number is correct\n' +
        '2. The project slug is in the correct format (e.g., gh/org/repo)\n' +
        '3. You have the necessary permissions to access this job',
    );
  }
};
