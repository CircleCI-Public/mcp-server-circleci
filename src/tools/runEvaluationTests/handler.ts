import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getBranchFromURL,
  getProjectSlugFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { runEvaluationTestsInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIClient } from '../../clients/client.js';

export const runEvaluationTests: ToolCallback<{
  params: typeof runEvaluationTestsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    projectURL,
    pipelineChoiceName,
    projectSlug: inputProjectSlug,
    files,
  } = args.params;

  let projectSlug: string | undefined;
  let branchFromURL: string | undefined;

  if (inputProjectSlug) {
    if (!branch) {
      return mcpErrorOutput(
        'Branch not provided. When using projectSlug, a branch must also be specified.',
      );
    }
    projectSlug = inputProjectSlug;
  } else if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
    branchFromURL = getBranchFromURL(projectURL);
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
    return mcpErrorOutput(`
          Project not found. Ask the user to provide the inputs user can provide based on the tool description.

          Project slug: ${projectSlug}
          Git remote URL: ${gitRemoteURL}
          Branch: ${branch}
          `);
  }
  const foundBranch = branchFromURL || branch;
  if (!foundBranch) {
    return mcpErrorOutput(
      'No branch provided. Try using the current git branch.',
    );
  }

  const circleci = getCircleCIClient();
  const { id: projectId } = await circleci.projects.getProject({
    projectSlug,
  });
  const pipelineDefinitions = await circleci.pipelines.getPipelineDefinitions({
    projectId,
  });

  const pipelineChoices = [
    ...pipelineDefinitions.map((definition) => ({
      name: definition.name,
      definitionId: definition.id,
    })),
  ];

  if (pipelineChoices.length === 0) {
    return mcpErrorOutput(
      'No pipeline definitions found. Please make sure your project is set up on CircleCI to run pipelines.',
    );
  }

  const formattedPipelineChoices = pipelineChoices
    .map(
      (pipeline, index) =>
        `${index + 1}. ${pipeline.name} (definitionId: ${pipeline.definitionId})`,
    )
    .join('\n');

  if (pipelineChoices.length > 1 && !pipelineChoiceName) {
    return {
      content: [
        {
          type: 'text',
          text: `Multiple pipeline definitions found. Please choose one of the following:\n${formattedPipelineChoices}`,
        },
      ],
    };
  }

  const chosenPipeline = pipelineChoiceName
    ? pipelineChoices.find((pipeline) => pipeline.name === pipelineChoiceName)
    : undefined;

  if (pipelineChoiceName && !chosenPipeline) {
    return mcpErrorOutput(
      `Pipeline definition with name ${pipelineChoiceName} not found. Please choose one of the following:\n${formattedPipelineChoices}`,
    );
  }

  const runPipelineDefinitionId =
    chosenPipeline?.definitionId || pipelineChoices[0].definitionId;

  const configContent = `
version: 2.1

jobs:
  hello-job-mcp:
    docker:
      - image: cimg/python:3.12.0
    steps:
      - run: |
          curl https://gist.githubusercontent.com/jvincent42/10bf3d2d2899033ae1530cf429ed03f8/raw/8cafcc58cdd21fe9e1c5757ef89ef57e0ac85b3a/eval.py > eval.py
          echo "deepeval>=2.8.2
          openai>=1.76.2
          pyyaml>=6.0.2
          " > requirements.txt
          pip install -r requirements.txt
      - run: |
          python eval.py ${files.join(' ')}

workflows:
  my-workflow-from-mcp:
    jobs:
      - hello-job-mcp
`;

  const runPipelineResponse = await circleci.pipelines.runPipeline({
    projectSlug,
    branch: foundBranch,
    definitionId: runPipelineDefinitionId,
    configContent,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Pipeline run successfully. View it at: https://app.circleci.com/pipelines/${projectSlug}/${runPipelineResponse.number}`,
      },
    ],
  };
};
