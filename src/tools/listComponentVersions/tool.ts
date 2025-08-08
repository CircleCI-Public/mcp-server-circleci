import { listComponentVersionsInputSchema } from './inputSchema.js';

export const listComponentVersionsTool = {
   name: 'list_component_versions' as const,
   description: `
     This tool lists all versions for a CircleCI component. It guides you through a multi-step process to gather the required information and provides lists of available options when parameters are missing.

     **Initial Requirements:**
     - You need either a \`projectSlug\` (from \`listFollowedProjects\`) or a \`projectID\`. The tool will automatically resolve the \`orgID\` from either of these.

     **Typical Flow:**
     1. **Start:** User requests component versions or deployment information.
     2. **Project Information:** Provide either \`projectSlug\` or \`projectID\`. The tool will automatically resolve the \`orgID\` and \`projectID\` as needed.
     3. **Environment Selection:** If \`environmentID\` is not provided, the tool will list all available environments for the organization and prompt the user to select one. Always return all available values without categorizing them.
     4. **Component Selection:** If \`componentID\` is not provided, the tool will list all available components for the project and prompt the user to select one. Always return all available values without categorizing them.
     5. **Version Listing:** Once both \`environmentID\` and \`componentID\` are provided, the tool will list all versions for that component in the specified environment.
     6. **Selection:** User selects a version from the list for subsequent operations.

     **Parameters:**
     - \`projectSlug\` (optional): The project slug from \`listFollowedProjects\` (e.g., "gh/organization/project"). Either this or \`projectID\` must be provided.
     - \`projectID\` (optional): The CircleCI project ID (UUID). Either this or \`projectSlug\` must be provided.
     - \`orgID\` (optional): The organization ID. If not provided, it will be automatically resolved from \`projectSlug\` or \`projectID\`.
     - \`environmentID\` (optional): The environment ID. If not provided, available environments will be listed.
     - \`componentID\` (optional): The component ID. If not provided, available components will be listed.

     **Behavior:**
     - The tool will guide you through the selection process step by step.
     - Automatically resolves \`orgID\` from \`projectSlug\` or \`projectID\` when needed.
     - When \`environmentID\` is missing, it lists environments and waits for user selection.
     - When \`componentID\` is missing (but \`environmentID\` is provided), it lists components and waits for user selection.
     - Only when both \`environmentID\` and \`componentID\` are provided will it list the actual component versions.
     - Make multiple calls to this tool as you gather the required parameters.

     **Common Use Cases:**
     - Identify which versions were deployed for a component
     - Identify which versions are live for a component
     - Identify which versions were deployed to an environment for a component
     - Identify which versions are not live for a component in an environment
     - Select a version for rollback or deployment operations
     - Obtain version name, namespace, and environment details for other CircleCI tools

     **Returns:**
     - When missing \`environmentID\`: A list of available environments with their IDs
     - When missing \`componentID\`: A list of available components with their IDs  
     - When both \`environmentID\` and \`componentID\` provided: A list of component versions with version name, namespace, environment ID, and is_live status

     **Important Notes:**
     - This tool requires multiple calls to gather all necessary information.
     - Either \`projectSlug\` or \`projectID\` must be provided; the tool will resolve the missing project information automatically.
     - The tool will prompt for missing \`environmentID\` and \`componentID\` by providing selection lists.
     - Always use the exact IDs returned by the tool in subsequent calls.
     - If pagination limits are reached, the tool will indicate that not all items could be displayed.

     **IMPORTANT:** Do not automatically run additional tools after this tool is called. Wait for explicit user instruction before executing further tool calls. The LLM MUST NOT invoke other CircleCI tools until receiving clear instruction from the user about what to do next, even if the user selects an option. It is acceptable to list out tool call options for the user to choose from, but do not execute them until instructed.
     `,
   inputSchema: listComponentVersionsInputSchema,
 };
 