import { getJobArtifactsInputSchema } from './inputSchema.js';

export const getJobArtifactsTool = {
  name: 'get_job_artifacts' as const,
  description: `
  Retrieves the list of artifacts from a specific CircleCI job.

  This tool supports multiple ways to specify which job's artifacts to retrieve:

  1. **Using project slug and job number**:
     - Provide projectSlug, branch, and jobNumber
     - projectSlug format: {vcs-provider}/{organization}/{project} (e.g., gh/circleci/circleci-docs)

  2. **Using a job URL**:
     - Provide the full CircleCI job URL
     - Supports both modern and legacy URL formats

  3. **Using workspace detection**:
     - Provide workspaceRoot (absolute path to project directory)
     - Optionally provide gitRemoteURL and branch
     - The tool will automatically detect project information

  Parameters:
  - params: An object that can contain:
    - projectSlug: The project identifier in format {vcs-provider}/{organization}/{project}
    - branch: The branch name (required with projectSlug)
    - jobNumber: The job number to fetch artifacts from (required with projectSlug)
    - jobURL: Full URL to the CircleCI job
    - workspaceRoot: Absolute path to the project directory
    - gitRemoteURL: URL of the git remote
    - artifactPath: Filter artifacts by path prefix (optional)

  Example usage:
  1. With project slug:
     {
       "params": {
         "projectSlug": "gh/circleci/circleci-docs",
         "branch": "master",
         "jobNumber": 12345
       }
     }

  2. With job URL:
     {
       "params": {
         "jobURL": "https://app.circleci.com/pipelines/gh/circleci/circleci-docs/123/workflows/abc-def/jobs/12345"
       }
     }

  3. With workspace detection:
     {
       "params": {
         "workspaceRoot": "/Users/username/projects/my-project",
         "jobNumber": 12345
       }
     }

  Returns:
  - A list of artifacts with their paths, URLs, and node indices
  - Each artifact contains:
    - path: The artifact file path
    - url: Download URL for the artifact
    - node_index: The node that produced the artifact
  `,
  inputSchema: getJobArtifactsInputSchema,
};
