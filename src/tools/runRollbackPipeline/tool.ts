import { runRollbackPipelineInputSchema } from './inputSchema.js';

export const runRollbackPipelineTool = {
  name: 'run_rollback_pipeline' as const,
  description: `
    Run a rollback pipeline for a CircleCI project. This tool guides you through the full rollback process, adapting to the information you provide and prompting for any missing details.

    **Initial Step:**
    - First, call the \`listFollowedProjects\` tool to retrieve the list of projects the user follows.
    - Then, ask the user to select a project by providing either a \`projectID\` or the exact \`projectSlug\` as returned by \`listFollowedProjects\`.

    **Typical Flow:**
    1. **Start:** User initiates a rollback request.
    2. **Project Selection:** If a \`projectSlug\` or \`projectID\` is not provided, call \`listFollowedProjects\` and prompt the user to select a project using the exact value returned.
    3. **Execute the tool and list the versions.**
    4. **Version Selection:** 
       - Present the user with available versions to rollback to, based on the selected environment and component.
       - Ask for both the current deployed version and the target version to rollback to.
    5. **Environment & Component Selection:** 
       - If the project has multiple environments or components, present up to 20 options for the user to choose from.
       - If there is only one environment and one component, proceed automatically and do not ask the user to select an environment or component.
    6. **Optional Details:** 
       - Prompt the user for an optional reason for the rollback (e.g., "Critical bug fix").
    7. **Confirmation:** 
       - Summarize the rollback request and confirm with the user before submitting.

    **Parameters:**
    - Either \`projectSlug\` (e.g., "gh/organization/repository") or \`projectID\` (UUID) must be provided.
    - \`environment_name\` (optional at first if multiple environments): The target environment (e.g., "production", "staging").
    - \`component_name\` (optional at first components): The component to rollback (e.g., "frontend", "backend").
    - \`current_version\` (optional at first): The currently deployed version.
    - \`target_version\` (optional at first): The version to rollback to.
    - \`reason\` (optional): Reason for the rollback.
    - \`parameters\` (optional): Additional rollback parameters as key-value pairs.

    **Behavior:**
    - If there are more than 20 environments or components, ask the user to refine their selection.
    - Never attempt to guess or construct project slugs or URLs; always use values provided by the user or from \`listFollowedProjects\`.
    - Do not prompt for missing parameters until versions have been listed.
    - Do not call this tool with incomplete parameters.
    - If the selected project lacks rollback pipeline configuration, provide a definitive error message without suggesting alternative projects.

    **Returns:**
    - On success: The rollback ID.
    - On error: A clear message describing what is missing or what went wrong.
    - If the selected project does not have a rollback pipeline configured: The tool will provide a clear error message specific to that project and will NOT suggest trying another project.

    **Important Note:**
    - This tool is designed to work only with the specific project provided by the user.
    - If a project does not have rollback capability configured, the tool will NOT suggest alternatives or recommend trying other projects.
    - The assistant should NOT suggest trying different projects when a project lacks rollback configuration.
    - Each project must have its own rollback pipeline configuration to be eligible for rollback operations.
    - When a project cannot be rolled back, provide only the configuration guidance for THAT specific project.

    If neither option is fully satisfied, prompt the user for the missing information before making the tool call.
  `,
  inputSchema: runRollbackPipelineInputSchema,
};
