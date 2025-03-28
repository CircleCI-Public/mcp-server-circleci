import { TCircleCIClient } from '../clients/circleci/index.js';

const getBuildLogsFromCommit = async ({
  circleci,
  projectSlug,
  branch,
  commit,
}: {
  circleci: TCircleCIClient;
  projectSlug: string;
  branch: string;
  commit: string;
}) => {
  const pipeline = await circleci.pipelines.getPipelineByCommit({
    projectSlug,
    branch,
    commit,
  });

  if (!pipeline) {
    throw new Error('Pipeline not found');
  }

  const workflows = await circleci.workflows.getPipelineWorkflows({
    pipelineId: pipeline.id,
  });

  const jobs = workflows.map(async (workflow) => {
    return await circleci.jobs.getWorkflowJobs({
      workflowId: workflow.id,
    });
  });

  console.error(jobs);

  // TODO: get the logs for each job
};

export default getBuildLogsFromCommit;
