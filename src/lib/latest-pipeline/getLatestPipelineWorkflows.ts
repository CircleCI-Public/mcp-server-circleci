import { getCircleCIClient } from '../../clients/client.js';

export type GetLatestPipelineWorkflowsParams = {
  projectSlug: string;
  branch?: string;
  pipelineId?: string;
};

export const getLatestPipelineWorkflows = async ({
  projectSlug,
  branch,
  pipelineId,
}: GetLatestPipelineWorkflowsParams) => {
  const circleci = getCircleCIClient();

  if (pipelineId) {
    return circleci.workflows.getPipelineWorkflows({ pipelineId });
  }

  const pipelines = await circleci.pipelines.getPipelines({
    projectSlug,
    branch,
  });

  const latestPipeline = pipelines?.[0];

  if (!latestPipeline) {
    throw new Error('Latest pipeline not found');
  }

  return circleci.workflows.getPipelineWorkflows({
    pipelineId: latestPipeline.id,
  });
};
