import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listComponentVersionsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';

type ProjectInfo = {
  projectID: string;
  orgID: string;
};


export const listComponentVersions: ToolCallback<{
  params: typeof listComponentVersionsInputSchema;
}> = async (args) => {
  const {
    projectSlug,
    projectID: providedProjectID,
    orgID: providedOrgID,
    componentID,
    environmentID,
  } = args.params ?? {};

  try {
    // Resolve project and organization information
    const projectInfoResult = await resolveProjectInfo(projectSlug, providedProjectID, providedOrgID);
    
    if (!projectInfoResult.success) {
      return projectInfoResult.error;
    }

    const { projectID, orgID } = projectInfoResult.data;

    // If environmentID is not provided, list environments
    if (!environmentID) {
      return await listEnvironments(orgID);
    }

    // If componentID is not provided, list components
    if (!componentID) {
      return await listComponents(projectID, orgID);
    }

    // If both componentID and environmentID are provided, list component versions
    return await fetchComponentVersions(componentID, environmentID);

  } catch (error) {
    return mcpErrorOutput(
      `Failed to list component versions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};


/**
 * Resolves project and organization information from the provided parameters
 */
async function resolveProjectInfo(
  projectSlug?: string,
  providedProjectID?: string,
  providedOrgID?: string,
): Promise<{ success: true; data: ProjectInfo } | { success: false; error: any }> {
  const circleci = getCircleCIClient();

  try {
    if (providedProjectID && providedOrgID) {
      // Both IDs provided, use them directly
      return {
        success: true,
        data: {
          projectID: providedProjectID,
          orgID: providedOrgID,
        },
      };
    }

    if (projectSlug) {
      // Use projectSlug to get projectID and orgID
      const { id: resolvedProjectId, organization_id: resolvedOrgId } = await circleci.projects.getProject({
        projectSlug,
      });
      return {
        success: true,
        data: {
          projectID: resolvedProjectId,
          orgID: resolvedOrgId,
        },
      };
    }

    if (providedProjectID) {
      // Use projectID to get orgID
      const { id: resolvedProjectId, organization_id: resolvedOrgId } = await circleci.projects.getProjectByID({
        projectID: providedProjectID,
      });
      return {
        success: true,
        data: {
          projectID: resolvedProjectId,
          orgID: resolvedOrgId,
        },
      };
    }

    return {
      success: false,
      error: mcpErrorOutput(`Invalid request. Please specify either a project slug or a project ID.`),
    };
  } catch (error) {
    const errorMessage = projectSlug
      ? `Failed to resolve project information for ${projectSlug}. Please verify the project slug is correct.`
      : `Failed to resolve project information for project ID ${providedProjectID}. Please verify the project ID is correct.`;

    return {
      success: false,
      error: mcpErrorOutput(`${errorMessage} ${error instanceof Error ? error.message : 'Unknown error'}`),
    };
  }
}

/**
 * Lists available environments for the organization
 */
async function listEnvironments(orgID: string) {
  const circleci = getCircleCIClient();

  const environments = await circleci.deploys.fetchEnvironments({
    orgID,
  });

  if (environments.items.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No environments found`,
        },
      ],
    };
  }

  const environmentsList = environments.items
    .map((env: any, index: number) => `${index + 1}. ${env.name} (ID: ${env.id})`)
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Please provide an environmentID. Available environments:\n\n${environmentsList}\n\n`,
      },
    ],
  };
}

/**
 * Lists available components for the project
 */
async function listComponents(projectID: string, orgID: string) {
  const circleci = getCircleCIClient();

  const components = await circleci.deploys.fetchProjectComponents({
    projectID,
    orgID,
  });

  if (components.items.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No components found`,
        },
      ],
    };
  }

  const componentsList = components.items
    .map((component: any, index: number) => `${index + 1}. ${component.name} (ID: ${component.id})`)
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Please provide a componentID. Available components:\n\n${componentsList}\n\n`,
      },
    ],
  };
}

/**
 * Lists component versions for the specified component and environment
 */
async function fetchComponentVersions(componentID: string, environmentID: string) {
  const circleci = getCircleCIClient();

  const componentVersions = await circleci.deploys.fetchComponentVersions({
    componentID,
    environmentID,
  });

  if (componentVersions.items.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No component versions found`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Versions for the component: ${JSON.stringify(componentVersions)}`,
      },
    ],
  };
}
