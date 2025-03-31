import { CircleCIClients } from '../circleci/index.js';

const circleci = new CircleCIClients({
  token: process.env.CIRCLECI_TOKEN ?? '',
});

export const getPipelineByCommit = async (args: {
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
    content: [{ type: 'text' as const, text: returnText }],
  };
};
