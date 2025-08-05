import { runRollbackPipelineInputSchema } from './inputSchema.js';

export const runRollbackPipelineTool = {
  name: 'run_rollback_pipeline' as const,
  description: `
    Run a rollback pipeline for a CircleCI project. This tool guides you through the full rollback process, adapting to the information you provide and prompting for any missing details.

    **Initial Requirements:**
    - You need either a \`projectSlug\` (from \`listFollowedProjects\`) or a \`projectID\`. The tool will automatically resolve the project information from either of these.

    **Typical Flow:**
    1. **Start:** User initiates a rollback request.
    2. **Project Selection:** If project id or project slug are not provided, call \`listFollowedProjects\` to get the list of projects the user follows and present the full list of projects to the user so that they can select the project they want to rollback.
    3. **Project Information:** Provide either \`projectSlug\` or \`projectID\`. The tool will automatically resolve the project information as needed.
    4. **Version Selection:** If component environment and version are not provided, call \`listComponentVersions\` to get the list of versions for the selected component and environment. If there is only one version, proceed automatically and do not ask the user to select a version. Otherwise, present the user with the full list of versions and ask them to select one. Always return all available values without categorizing them.
    5. **Rollback Reason** ask the user for an optional reason for the rollback (e.g., "Critical bug fix"). Skip this step is the user explicitly requests a rollback by workflow rerun.
    6. **Rollback pipeline check** if the tool reports that no rollback pipeline is defined, ask the user if they want to trigger a rollback by workflow rerun or suggest to setup a rollback pipeline following the documentation at https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/.
    7. **Confirmation:** Summarize the rollback request and confirm with the user before submitting.
    8. **Pipeline Rollback:**  if the user requested a rollback by pipeline, call \`runRollbackPipeline\` passing all parameters including the namespace associated with the version to the tool.
    9. **Workflow Rerun** If the user requested a rollback by workflow rerun, call \`rerunWorkflow\` passing the workflow ID of the selected version to the tool.
    10.**Completion:** Report the outcome of the operation.

    **Parameters:**
    - \`projectSlug\` (optional): The project slug from \`listFollowedProjects\` (e.g., "gh/organization/project"). Either this or \`projectID\` must be provided.
    - \`projectID\` (optional): The CircleCI project ID (UUID). Either this or \`projectSlug\` must be provided.
    - \`environmentName\` (required): The target environment (e.g., "production", "staging").
    - \`componentName\` (required): The component to rollback (e.g., "frontend", "backend").
    - \`currentVersion\` (required): The currently deployed version.
    - \`targetVersion\` (required): The version to rollback to.
    - \`namespace\` (required): The namespace of the component.
    - \`reason\` (optional): Reason for the rollback.
    - \`parameters\` (optional): Additional rollback parameters as key-value pairs.

    **Behavior:**
    - If there are more than 20 environments or components, ask the user to refine their selection.
    - Never attempt to guess or construct project slugs or URLs; always use values provided by the user or from \`listFollowedProjects\`.
    - Do not prompt for missing parameters until versions have been listed.
    - Do not call this tool with incomplete parameters.
    - If the selected project lacks rollback pipeline configuration, provide a definitive error message without suggesting alternative projects.

    **Returns:**
    - On success: The rollback ID or a confirmation in case of workflow rerun.
    - On error: A clear message describing what is missing or what went wrong.
    - If the selected project does not have a rollback pipeline configured: The tool will provide a clear error message specific to that project and will NOT suggest trying another project.

    **Important Note:**
    - This tool is designed to work only with the specific project provided by the user.
    - If a project does not have rollback capability configured, the tool will NOT recommend trying other projects.
    - The assistant should NOT suggest trying different projects when a project lacks rollback configuration.
    - Each project must have its own rollback pipeline configuration to be eligible for rollback operations.
    - When a project cannot be rolled back, provide only the configuration guidance for THAT specific project.
    - The tool automatically resolves project information from either \`projectSlug\` or \`projectID\`.
    If no version is found, the tool will suggest the user to set up deploy markers following the documentation at:
    https://circleci.com/docs/deploy/configure-deploy-markers/
  `,
  inputSchema: runRollbackPipelineInputSchema,
};
