import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { runRollbackPipelineInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIClient } from '../../clients/client.js';

export const runRollbackPipeline: ToolCallback<{
  params: typeof runRollbackPipelineInputSchema;
}> = async (args: any) => {
  const {
    projectSlug,
    projectID: providedProjectID,
    environmentName,
    componentName,
    currentVersion,
    targetVersion,
    namespace,
    reason,
    parameters,
  } = args.params;


  // Init the client and get the base URL
  const circleci = getCircleCIClient();
  
  // Resolve project ID from projectSlug or use provided projectID
  let projectID: string;
  try {
    if (providedProjectID) {
      projectID = providedProjectID;
    } else if (projectSlug) {
      const { id: resolvedProjectId } = await circleci.projects.getProject({
        projectSlug,
      });
      projectID = resolvedProjectId;
    } else {
      return mcpErrorOutput('Either projectSlug or projectID must be provided');
    }
  } catch (error) {
    const errorMessage = projectSlug
      ? `Failed to resolve project information for ${projectSlug}. Please verify the project slug is correct.`
      : `Failed to resolve project information for project ID ${providedProjectID}. Please verify the project ID is correct.`;
    
    return mcpErrorOutput(`${errorMessage} ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // First, check if the project has a rollback pipeline definition configured
  try {
    const deploySettings = await circleci.deploys.fetchProjectDeploySettings({
      projectID,
    });

    if (!deploySettings.rollback_pipeline_definition_id) {
      return {
        content: [
          {
            type: 'text',
            text: 'No rollback pipeline definition found for this project. You may need to configure a rollback pipeline first using https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/ or you can trigger a rollback by workflow rerun.',
          },
        ],
      };
    }
  } catch (error) {
    return mcpErrorOutput(
      `Failed to fetch rollback pipeline definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
  
  // Check if this is a new rollback request with required fields

  const rollbackRequest = {
    environment_name: environmentName,
    component_name: componentName,
    current_version: currentVersion,
    target_version: targetVersion,
    ...(namespace && { namespace }),
    ...(reason && { reason }),
    ...(parameters && { parameters }),
  };

  try {
    const rollbackResponse = await circleci.deploys.runRollbackPipeline({
      projectID,
      rollbackRequest,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Rollback initiated successfully. ID: ${rollbackResponse.id}, Type: ${rollbackResponse.rollback_type}`,
        },
      ],
    };
  } catch (error) {
    return mcpErrorOutput(
      `Failed to initiate rollback: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};
