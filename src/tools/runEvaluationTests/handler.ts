import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { gzipSync } from 'zlib';
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
    promptFiles,
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

  if (!promptFiles || promptFiles.length === 0) {
    return mcpErrorOutput(
      'No prompt template files provided. Please ensure you have prompt template files in the ./prompts directory (e.g. <relevant-name>.prompt.yml) and include them in the promptFiles parameter.',
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

  // Process each file for compression and encoding
  const processedFiles = promptFiles.map((promptFile) => {
    const fileExtension = promptFile.fileName.toLowerCase();
    let processedPromptFileContent: string;

    if (fileExtension.endsWith('.json')) {
      // For JSON files, parse and re-stringify to ensure proper formatting
      const json = JSON.parse(promptFile.fileContent);
      processedPromptFileContent = JSON.stringify(json, null);
    } else if (
      fileExtension.endsWith('.yml') ||
      fileExtension.endsWith('.yaml')
    ) {
      // For YAML files, keep as-is
      processedPromptFileContent = promptFile.fileContent;
    } else {
      // Default to treating as text content
      processedPromptFileContent = promptFile.fileContent;
    }

    // Gzip compress the content and then base64 encode for compact transport
    const gzippedContent = gzipSync(processedPromptFileContent);
    const base64GzippedContent = gzippedContent.toString('base64');

    return {
      fileName: promptFile.fileName,
      base64GzippedContent,
    };
  });

  // Generate file creation commands with conditional logic for parallelism
  const fileCreationCommands = processedFiles
    .map(
      (file, index) =>
        `          if [ "$CIRCLE_NODE_INDEX" = "${index}" ]; then
            sudo mkdir -p /prompts
            echo "${file.base64GzippedContent}" | base64 -d | gzip -d | sudo tee /prompts/${file.fileName} > /dev/null
          fi`,
    )
    .join('\n');

  // Generate individual evaluation commands with conditional logic for parallelism
  const evaluationCommands = processedFiles
    .map(
      (file, index) =>
        `          if [ "$CIRCLE_NODE_INDEX" = "${index}" ]; then
            python eval.py ${file.fileName}
          fi`,
    )
    .join('\n');

  const configContent = `
version: 2.1

jobs:
  evaluate-prompt-template-tests:
    parallelism: ${processedFiles.length}
    docker:
      - image: cimg/python:3.12.0
    steps:
      - run: |
          curl https://gist.githubusercontent.com/jvincent42/10bf3d2d2899033ae1530cf429ed03f8/raw/acf07002d6bfcfb649c913b01a203af086c1f98d/eval.py > eval.py
          echo "deepeval>=3.0.3
          openai>=1.84.0
          anthropic>=0.54.0
          PyYAML>=6.0.2
          " > requirements.txt
          pip install -r requirements.txt
      - run: |
${fileCreationCommands}
      - run: |
${evaluationCommands}

workflows:
  mcp-run-evaluation-tests:
    jobs:
      - evaluate-prompt-template-tests
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
