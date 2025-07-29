import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { runRollbackPipelineInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIClient } from '../../clients/client.js';

export const runRollbackPipeline: ToolCallback<{
  params: typeof runRollbackPipelineInputSchema;
}> = async (args) => {
  const {
    projectSlug: inputProjectSlug,
    environment_name,
    component_name,
    current_version,
    target_version,
    reason,
    parameters,
    projectID,
  } = args.params;

  let environmentName = environment_name;
  const componentName = component_name;

  // They need to provide the projectID or projectSlug
  const hasProjectIDOrSlug = inputProjectSlug || projectID;
  if (!hasProjectIDOrSlug) {
    return mcpErrorOutput(
      'For rollback requests, projectSlug or projectID is required.',
    );
  }

  let updatedProjectID = projectID;
  let orgID = undefined;
  // Init the client and get the base URL
  const circleci = getCircleCIClient();

  // Get project information - we need both projectID and orgID
  if (inputProjectSlug) {
    // Use projectSlug to get projectID and orgID
    try {
      const { id: projectId, organization_id: orgId } = await circleci.projects.getProject({
        projectSlug: inputProjectSlug,
      });
      updatedProjectID = projectId;
      orgID = orgId;
    } catch (error) {
      return mcpErrorOutput(
        `Failed to get project information for ${inputProjectSlug}. Please verify the project slug is correct. ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  } else if (projectID) {
    // Use projectID directly - we need to get orgID somehow
    updatedProjectID = projectID;
    try {
      // Try to get project info using projectID to get orgID
      const { organization_id: orgId } = await circleci.projects.getProjectByID({
        projectID: projectID,
      });
      orgID = orgId;
    } catch (error) {
      return mcpErrorOutput(
        `Failed to get project information for project ID ${projectID}. Please verify the project ID is correct. ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  if (!updatedProjectID || !orgID) {
    return mcpErrorOutput(
      'Could not get project information. Please verify the projectID or slug is correct.',
    );
  }

  // Check if the project has a rollback pipeline defined (fail fast)
  const deploySettings = await circleci.deploys.fetchProjectDeploySettings({
    projectID: updatedProjectID,
  });

  if (!deploySettings || !deploySettings.rollback_pipeline_definition_id) {
    return mcpErrorOutput(
      'No rollback pipeline defined for this project. See https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/ for more information.',
    );
  }

  // Get the components for this project, if there is only one we can use the informations
  // If there is a component, we are sure there is a deploy marker
  const components = await circleci.deploys.fetchProjectComponents({
    projectID: updatedProjectID,
    orgID: orgID,
  });

  if (components?.items.length === 0) {
    // If there is no components, we can't rollback since there are no deploy markers
    return mcpErrorOutput(
      'No components found for this project. Set up deploy markers to use this tool. See https://circleci.com/docs/deploy/configure-deploy-markers/ for more information.',
    );
  }

  // Fetch the environments for this project
  const environments = await circleci.deploys.fetchEnvironments({
    orgID: orgID,
  });

  if (environments.items.length === 0) {
    // If there is no components, we can't rollback since there are no deploy markers
    return mcpErrorOutput(
      'No environments found for this project. Set up one using https://circleci.com/docs/deploy/configure-deploy-markers/#manage-environments',
    );
  }

  // If multiple environments, we need to ask the user to select one
  if (environments.items.length > 1 && !environment_name) {
    const environmentList = environments.items
      .map((env, index) => `${index + 1}. ${env.name} (ID: ${env.id})`)
      .join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `Multiple environments found for this project. Please specify environment_name parameter with one of the following:\n\n${environmentList}\n\nExample: Call the rollback tool again with environment_name set to "${environments.items[0].name}"`,
        },
      ],
    };
  }

  // If there is only one environment, we can use the information
  if (environments.items.length === 1) {
    environmentName = environments.items[0].name;
    // We'll inform the user about this auto-selection when showing component versions
  }

  // If user provided environment_name, find the matching environment
  if (environment_name && environments.items.length > 1) {
    const selectedEnvironment = environments.items.find(env => env.name === environment_name);
    if (!selectedEnvironment) {
      const environmentList = environments.items
        .map((env, index) => `${index + 1}. ${env.name}`)
        .join('\n');
      
      return mcpErrorOutput(
        `Environment "${environment_name}" not found. Available environments:\n\n${environmentList}`
      );
    }
    environmentName = selectedEnvironment.name;
  }


  // Find the current environment to work with
  let currentEnvironment = environments.items[0]; // default to first
  if (environmentName && environments.items.length > 1) {
    const foundEnv = environments.items.find(env => env.name === environmentName);
    if (foundEnv) {
      currentEnvironment = foundEnv;
    }
  }

  // Check if this is a new rollback request with required fields
  const isRollbackRequestComplete = environment_name && component_name && current_version && target_version;
  
  // If only projectSlug is provided, fetch and show component versions for selection
  if (!isRollbackRequestComplete) {
    // Show which environment and component we're working with
    const selectedComponent = components.items[0];
    let message = '';
    // Environment selection message
    if (environments.items.length === 1) {
      message += `Found 1 environment: "${currentEnvironment.name}". Using this environment for rollback.\n`;
    } else {
      message += `Using environment: "${currentEnvironment.name}".\n`;
    }
    // Component selection message
    if (components.items.length === 1) {
      message += `Found 1 component: "${selectedComponent.name}". Using this component for rollback.\n\n`;
    } else {
      message += `Found ${components.items.length} components. Using component: "${selectedComponent.name}".\n\n`;
    }

    // Fetch the versions
    const componentVersions = await circleci.deploys.fetchComponentVersions({
      componentID: selectedComponent.id,
      environmentID: currentEnvironment.id,
    });

    return {
      content: [
        {
          type: 'text',
          text: `${message}Select a component version from: ${JSON.stringify(componentVersions)}`,
        },
      ],
    };
  }

  // Fetch component versions for actual rollback execution
  const componentVersions = await circleci.deploys.fetchComponentVersions({
    componentID: components.items[0].id,
    environmentID: currentEnvironment.id,
  });

  const currentVersion = componentVersions.items.find(
    (component) => component.is_live
  )?.name;

  const namespace = componentVersions.items.find(
    (component) => component.is_live
  )?.namespace;
  
  if (isRollbackRequestComplete) {
    // Handle new rollback API
    const rollbackRequest = {
      environment_name: environmentName!,
      component_name: componentName!,
      current_version: currentVersion!,
      target_version: target_version!,
      ...(namespace && { namespace }),
      ...(reason && { reason }),
      ...(parameters && { parameters }),
    };

    try {
      const rollbackResponse = await circleci.deploys.runRollbackPipeline({
        projectID: updatedProjectID,
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
  }

  return mcpErrorOutput(
    'Incomplete rollback request. Please provide environment_name, component_name, current_version, and target_version.',
  );
};
