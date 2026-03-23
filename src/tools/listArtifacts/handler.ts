import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromURL,
  identifyProjectSlug,
  getJobNumberFromURL,
  getBranchFromURL,
  getPipelineNumberFromURL,
} from '../../lib/project-detection/index.js';
import { listArtifactsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import { Pipeline, Artifact } from '../../clients/schemas.js';
import { rateLimitedRequests } from '../../lib/rateLimitedRequests/index.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import outputTextTruncated from '../../lib/outputTextTruncated.js';

type JobArtifacts = {
  jobNumber: number;
  artifacts: Artifact[];
};

const formatArtifacts = (jobArtifacts: JobArtifacts[]): string => {
  if (jobArtifacts.length === 0) {
    return 'No artifacts found.';
  }

  const lines: string[] = [];
  for (const { jobNumber, artifacts } of jobArtifacts) {
    if (artifacts.length === 0) {
      continue;
    }
    lines.push(`## Job ${jobNumber}`);
    for (const artifact of artifacts) {
      lines.push(`- **${artifact.path}**`);
      lines.push(`  URL: ${artifact.url}`);
      lines.push(`  Node index: ${artifact.node_index}`);
    }
    lines.push('');
  }

  if (lines.length === 0) {
    return 'No artifacts found.';
  }

  return lines.join('\n');
};

export const listArtifacts: ToolCallback<{
  params: typeof listArtifactsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    projectURL,
    projectSlug: inputProjectSlug,
  } = args.params ?? {};

  let projectSlug: string | undefined;
  let pipelineNumber: number | undefined;
  let branchFromURL: string | undefined;
  let jobNumber: number | undefined;

  if (inputProjectSlug) {
    if (!branch) {
      return mcpErrorOutput(
        'Branch not provided. When using projectSlug, a branch must also be specified.',
      );
    }
    projectSlug = inputProjectSlug;
  } else if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
    pipelineNumber = getPipelineNumberFromURL(projectURL);
    branchFromURL = getBranchFromURL(projectURL);
    jobNumber = getJobNumberFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL && branch) {
    projectSlug = await identifyProjectSlug({
      gitRemoteURL,
    });
  } else {
    return mcpErrorOutput(
      'Missing required inputs. Please provide either: 1) projectSlug with branch, 2) projectURL, or 3) workspaceRoot with gitRemoteURL and branch.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput(
      `Project not found. Ask the user to provide the inputs based on the tool description.`,
    );
  }

  const circleci = getCircleCIClient();

  // If a specific job number is provided, fetch artifacts for that job only
  if (jobNumber) {
    try {
      const artifacts = await circleci.jobs.getJobArtifacts({
        projectSlug,
        jobNumber,
      });

      const output = formatArtifacts([{ jobNumber, artifacts }]);
      return outputTextTruncated(output);
    } catch (error) {
      return mcpErrorOutput(
        `Failed to fetch artifacts for job ${jobNumber}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Otherwise, find jobs from the latest pipeline and get artifacts for all of them
  let pipeline: Pipeline | undefined;

  if (pipelineNumber) {
    pipeline = await circleci.pipelines.getPipelineByNumber({
      projectSlug,
      pipelineNumber,
    });
  }

  if (!pipeline) {
    const pipelines = await circleci.pipelines.getPipelines({
      projectSlug,
      branch: branchFromURL || branch,
    });

    pipeline = pipelines?.[0];
    if (!pipeline) {
      return mcpErrorOutput('No pipelines found for this project and branch.');
    }
  }

  const workflows = await circleci.workflows.getPipelineWorkflows({
    pipelineId: pipeline.id,
  });

  const jobs = (
    await Promise.all(
      workflows.map(async (workflow) => {
        return await circleci.jobs.getWorkflowJobs({
          workflowId: workflow.id,
        });
      }),
    )
  ).flat();

  const jobArtifacts = await rateLimitedRequests(
    jobs.map((job) => async (): Promise<JobArtifacts> => {
      if (!job.job_number) {
        return { jobNumber: 0, artifacts: [] };
      }

      try {
        const artifacts = await circleci.jobs.getJobArtifacts({
          projectSlug: projectSlug!,
          jobNumber: job.job_number,
        });
        return { jobNumber: job.job_number, artifacts };
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return { jobNumber: job.job_number, artifacts: [] };
        }
        if (error instanceof Error && error.message.includes('429')) {
          return { jobNumber: job.job_number, artifacts: [] };
        }
        throw error;
      }
    }),
  );

  const output = formatArtifacts(jobArtifacts);
  return outputTextTruncated(output);
};
