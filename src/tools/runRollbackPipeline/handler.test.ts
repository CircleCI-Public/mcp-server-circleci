import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRollbackPipeline } from './handler.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('runRollbackPipeline handler', () => {
  const mockCircleCIClient = {
    projects: {
      getProject: vi.fn(),
    },
    workflows: {
      rerunWorkflow: vi.fn(),
    },
    deploys: {
      fetchProjectDeploySettings: vi.fn(),
      runRollbackPipeline: vi.fn(),
      fetchProjectComponents: vi.fn(),
      fetchEnvironments: vi.fn(),
      fetchComponentVersions: vi.fn(),
    },
  };

  const mockExtra = {
    signal: new AbortController().signal,
    requestId: 'test-id',
    sendNotification: vi.fn(),
    sendRequest: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(clientModule, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );
  });

  it('should return a valid MCP error response when no inputs are provided', async () => {
    const args = {
      params: {},
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('For rollback requests, projectSlug or projectID is required.');
  });

  it('should return error when rollback request is missing both projectSlug and projectID', async () => {
    const args = {
      params: {
        environment_name: 'production',
        component_name: 'my-app',
        current_version: '1.2.0',
        target_version: '1.1.0',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('For rollback requests, projectSlug or projectID is required.');
  });  

  it('should return a valid MCP error response when project slug is not found', async () => {
    mockCircleCIClient.projects.getProject.mockRejectedValue(new Error('Project not found'));

    const args = {
      params: {
        projectSlug: 'gh/org/nonexistent-repo',
        environment_name: 'prod',
        component_name: 'api',
        current_version: '1.0.0',
        target_version: '0.9.0',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain('Failed to get project information');
  });

  it('should return a valid MCP error response when project ID is not found', async () => {
    const args = {
      params: {
        projectID: 'project-id',
        environment_name: 'prod',
        component_name: 'api',
        current_version: '1.0.0',
        target_version: '0.9.0',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain('Failed to get project information');
  });

  it('should fetch and return component versions when there is only one component and one environment', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [{ id: 'env-1', name: 'production' }],
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [
        {
          name: '1.0.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: true,
          pipeline_id: 'pipeline-1',
          workflow_id: 'workflow-1',
          job_id: 'job-1',
          job_number: 1,
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
        {
          name: '0.9.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: false,
          pipeline_id: 'pipeline-2',
          workflow_id: 'workflow-2',
          job_id: 'job-2',
          job_number: 2,
          last_deployed_at: '2024-12-31T00:00:00Z',
        },
      ],
      next_page_token: null,
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Select a component version from:');
    expect(mockCircleCIClient.deploys.fetchComponentVersions).toHaveBeenCalledWith({
      componentID: 'component-1',
      environmentID: 'env-1',
    });
  });

  it('should return error when no components are found', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('No components found for this project');
  });

  it('should prompt for component selection when multiple components exist', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [
        { id: 'component-1', name: 'backend' },
        { id: 'component-2', name: 'frontend' },
      ],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain('Multiple components found for this project');
    expect(response.content[0].text).toContain('component-1');
    expect(response.content[0].text).toContain('component-2');
  });

  it('should return error for invalid component name', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [
        { id: 'component-1', name: 'backend' },
        { id: 'component-2', name: 'frontend' },
      ],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        component_name: 'nonexistent',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Component "nonexistent" not found');
  });

  it('should return error when no environments are found', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');  
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('No environments found for this project');
  });

  it('should prompt for environment selection when multiple environments exist', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [
        { id: 'env-1', name: 'production' },
        { id: 'env-2', name: 'staging' },
      ],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain('Multiple environments found for this project');
    expect(response.content[0].text).toContain('production');
    expect(response.content[0].text).toContain('staging');
  });

  it('should return error for invalid environment name', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [
        { id: 'env-1', name: 'production' },
        { id: 'env-2', name: 'staging' },
      ],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        environment_name: 'nonexistent',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Environment "nonexistent" not found');
  });

  it('should suggest workflow rerun when no rollback pipeline is configured', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      // No rollback_pipeline_id
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        rollback_type: 'PIPELINE',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain('No rollback pipeline defined for this project');
    expect(response.content[0].text).toContain('WORKFLOW_RERUN');
  });

  it('should successfully execute pipeline rollback', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [{ id: 'env-1', name: 'production' }],
    });
    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [
        {
          name: '1.0.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: true,
          pipeline_id: 'pipeline-1',
          workflow_id: 'workflow-1',
          job_id: 'job-1',
          job_number: 1,
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    mockCircleCIClient.deploys.runRollbackPipeline.mockResolvedValue({
      id: 'rollback-123',
      rollback_type: 'PIPELINE',
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        rollback_type: 'PIPELINE',
        environment_name: 'production',
        component_name: 'backend',
        current_version: '1.0.0',
        target_version: '0.9.0',
        reason: 'Critical bug fix',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain('Rollback initiated successfully');
    expect(response.content[0].text).toContain('rollback-123');
    expect(mockCircleCIClient.deploys.runRollbackPipeline).toHaveBeenCalledWith({
      projectID: 'project-id',
      rollbackRequest: {
        environment_name: 'production',
        component_name: 'backend',
        current_version: '1.0.0',
        target_version: '0.9.0',
        namespace: 'prod',
        reason: 'Critical bug fix',
      },
    });
  });

  it('should successfully execute workflow rerun', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [{ id: 'env-1', name: 'production' }],
    });
    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [
        {
          name: '1.0.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: true,
          pipeline_id: 'pipeline-1',
          workflow_id: 'workflow-1',
          job_id: 'job-1',
          job_number: 1,
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    mockCircleCIClient.workflows.rerunWorkflow.mockResolvedValue({
      workflow_id: 'workflow-1',
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        rollback_type: 'WORKFLOW_RERUN',
        environment_name: 'production',
        component_name: 'backend',
        current_version: '1.0.0',
        target_version: '0.9.0',
        workflow_id: 'workflow-1',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toContain('Workflow rerun initiated successfully');
    expect(mockCircleCIClient.workflows.rerunWorkflow).toHaveBeenCalledWith({
      workflowId: 'workflow-1',
      fromFailed: false,
    });
  });

  it('should return error when workflow_id is missing for workflow rerun', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [{ id: 'env-1', name: 'production' }],
    });
    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [
        {
          name: '1.0.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: true,
          pipeline_id: 'pipeline-1',
          workflow_id: 'workflow-1',
          job_id: 'job-1',
          job_number: 1,
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
      ],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        rollback_type: 'WORKFLOW_RERUN',
        environment_name: 'production',
        component_name: 'backend', 
        current_version: '1.0.0',
        target_version: '0.9.0',
        // workflow_id is missing
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('The selected version has no associated workflow');
  });

  it('should handle rollback pipeline execution error', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
      rollback_pipeline_definition_id: 'rollback-pipeline-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [{ id: 'env-1', name: 'production' }],
    });
    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [
        {
          name: '1.0.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: true,  
          pipeline_id: 'pipeline-1',
          workflow_id: 'workflow-1',
          job_id: 'job-1',
          job_number: 1,
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    mockCircleCIClient.deploys.runRollbackPipeline.mockRejectedValue(
      new Error('Rollback failed'),
    );

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        rollback_type: 'PIPELINE',
        environment_name: 'production',
        component_name: 'backend',
        current_version: '1.0.0',
        target_version: '0.9.0',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Failed to initiate rollback');
    expect(response.content[0].text).toContain('Rollback failed');
  });

  it('should handle workflow rerun execution error', async () => {
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
      organization_id: 'org-id',
    });
    mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
      items: [{ id: 'component-1', name: 'backend' }],
    });
    mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
      items: [{ id: 'env-1', name: 'production' }],
    });
    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [
        {
          name: '1.0.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: true,
          pipeline_id: 'pipeline-1',
          workflow_id: 'workflow-1',
          job_id: 'job-1',
          job_number: 1,
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    mockCircleCIClient.workflows.rerunWorkflow.mockRejectedValue(
      new Error('Workflow rerun failed'),
    );

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        rollback_type: 'WORKFLOW_RERUN',
        environment_name: 'production',
        component_name: 'backend',
        current_version: '1.0.0',
        target_version: '0.9.0',
        workflow_id: 'workflow-1',
      },
    } as any;

    const response = await runRollbackPipeline(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Failed to initiate rollback');
    expect(response.content[0].text).toContain('Workflow rerun failed');
  });
});
