import { z } from 'zod';

export const rerunWorkflowInputSchema = z.object({
  workflowId: z
    .string()
    .describe(
      'This should be the workflowId of the workflow that need rerun. The workflowId is an UUID. An example workflowId is a12145c5-90f8-4cc9-98f2-36cb85db9e4b',
    )
    .optional(),
  fromFailed: z
    .boolean()
    .describe(
      'This should be true by default. If the user wants to rerun workflow from start, set this to false',
    )
    .optional(),
  workflowURL: z
    .string()
    .describe(
      'The URL of the CircleCI workflow or job. Can be any of these formats:\n' +
        '- Workflow URL: https://app.circleci.com/pipelines/:vcsType/:orgName/:projectName/:pipelineNumber/workflows/:workflowId' +
        '- Job URL: https://app.circleci.com/pipelines/:vcsType/:orgName/:projectName/:pipelineNumber/workflows/:workflowId/jobs/:buildNumber',
    )
    .optional(),
});
