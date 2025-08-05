import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { runRollbackPipelineInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { getCircleCIClient } from '../../clients/client.js';

export const runRollbackPipeline: ToolCallback<{
  params: typeof runRollbackPipelineInputSchema;
}> = async (args: any) => {
  const {
    projectSlug: inputProjectSlug,
    environment_name,
    component_name,
    current_version,
    target_version,
    workflow_id,
    reason,
    parameters,
    projectID,
    rollback_type,
  } = args.params;
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

  if (rollback_type === 'PIPELINE') {
    // // Check if the project has a rollback pipeline defined (only needed for actual rollback)
    try {
      const deploySettings = await circleci.deploys.fetchProjectDeploySettings({
        projectID: updatedProjectID,
      });

      if (!deploySettings.rollback_pipeline_definition_id) {
          return {
            content: [
              {
                type: 'text',
                text: `No rollback pipeline defined for this project. Would you like to rerun a workflow instead? Call this tool again with rollback_type set to "WORKFLOW_RERUN".
                Otherwise, you can set up a rollback pipeline using https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/
                `
              }
            ]
          };
      }
    } catch {
      return mcpErrorOutput(
        'Failed to fetch rollback pipeline definition. Please try again later.',
      );
    }
  }
  
  // Get the components for this project, if there is only one we can use the information
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

  if (components.items.length > 1 && !component_name) {
    const componentList = components.items
      .map((env: any, index: number) => `${index + 1}. ${env.name} (ID: ${env.id})`)
      .join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `Multiple components found for this project. Please specify component_name parameter with one of the following:\n\n${componentList}\n\nExample: Call the rollback tool again with component_name set to "${components.items[0].name}"`,
        },
      ],
    };
  }

  let selectedComponent = components.items[0];

  if (component_name) {
    const matchingComponent = components.items.find((component: any) => component.name === component_name);
    if (!matchingComponent) {
      const componentList = components.items
        .map((component: any, index: number) => `${index + 1}. ${component.name}`)
        .join('\n');
      
      return mcpErrorOutput(
        `Component "${component_name}" not found. Available components:\n\n${componentList}`
      );
    }
    selectedComponent = matchingComponent;
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
      .map((env: any, index: number) => `${index + 1}. ${env.name} (ID: ${env.id})`)
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

  let selectedEnvironment = environments.items[0];

  // If user provided environment_name, find the matching environment
  if (environment_name) {
    const matchingEnvironment = environments.items.find((env: any) => env.name === environment_name);
    if (!matchingEnvironment) {
      const environmentList = environments.items
        .map((env: any, index: number) => `${index + 1}. ${env.name}`)
        .join('\n');
      
      return mcpErrorOutput(
        `Environment "${environment_name}" not found. Available environments:\n\n${environmentList}`
      );
    }
    selectedEnvironment = matchingEnvironment;
  }

  // Check if this is a new rollback request with required fields
  const isRollbackRequestComplete = environment_name && component_name && current_version && target_version;
  
  // If only projectSlug is provided, fetch and show component versions for selection
  if (!isRollbackRequestComplete) {
    // Show which environment and component we're working with
    let message = '';
    // Environment selection message
    if (environments.items.length === 1) {
      message += `Found 1 environment: "${selectedEnvironment.name}". Using this environment for rollback.\n`;
    } else {
      message += `Using environment: "${selectedEnvironment.name}".\n`;
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
      environmentID: selectedEnvironment.id,
      workflowID: workflow_id,
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
    environmentID: selectedEnvironment.id,
  });

  const currentVersion = componentVersions.items.find(
    (component: any) => component.is_live
  )?.name;

  const namespace = componentVersions.items.find(
    (component: any) => component.is_live
  )?.namespace;
  
  if (isRollbackRequestComplete && rollback_type === 'PIPELINE') {
    // Handle new rollback API
    const rollbackRequest = {
      environment_name: selectedEnvironment.name!,
      component_name: selectedComponent.name!,
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

  if (isRollbackRequestComplete && rollback_type === 'WORKFLOW_RERUN') {

    if (!workflow_id) {
      return mcpErrorOutput(
        'The selected version has no associated workflow. Please select a different version.',
      );
    }

    try {
      // Handle workflow rerun
      await circleci.workflows.rerunWorkflow({
        workflowId: workflow_id!,
        fromFailed: false,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Workflow rerun initiated successfully.`,
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
