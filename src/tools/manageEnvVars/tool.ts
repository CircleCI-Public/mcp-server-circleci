import {
  listEnvVarsInputSchema,
  createEnvVarInputSchema,
  deleteEnvVarInputSchema,
} from './inputSchema.js';

export const listEnvVarsTool = {
  name: 'list_env_vars' as const,
  description: `
    List all environment variables for a CircleCI project.

    Values are masked by the CircleCI API — only the last 4 characters are shown.
    Use this to check what environment variables are currently set before creating or deleting them.

    Input:
    - projectSlug: The project slug from listFollowedProjects (e.g., "gh/organization/project")

    Returns:
    - A list of environment variable names and their masked values
    `,
  inputSchema: listEnvVarsInputSchema,
};

export const createEnvVarTool = {
  name: 'create_env_var' as const,
  description: `
    Create or update an environment variable for a CircleCI project.

    If an environment variable with the same name already exists, it will be overwritten.

    Input:
    - projectSlug: The project slug from listFollowedProjects (e.g., "gh/organization/project")
    - name: The name of the environment variable (e.g., "API_KEY", "DATABASE_URL")
    - value: The value of the environment variable

    Returns:
    - Confirmation with the variable name and masked value
    `,
  inputSchema: createEnvVarInputSchema,
};

export const deleteEnvVarTool = {
  name: 'delete_env_var' as const,
  description: `
    Delete an environment variable from a CircleCI project.

    Input:
    - projectSlug: The project slug from listFollowedProjects (e.g., "gh/organization/project")
    - name: The name of the environment variable to delete

    Returns:
    - Confirmation of deletion
    `,
  inputSchema: deleteEnvVarInputSchema,
};
