import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRollbackPipeline } from './handler.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('runRollbackPipeline handler', () => {
  const mockCircleCIClient = {
    projects: {
      getProject: vi.fn(),
    },
    pipelines: {
      runRollbackPipeline: vi.fn(),
      fetchProjectDeploySettings: vi.fn(),
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

  it('should return a valid MCP error response when missing required inputs', async () => {
    const args = {
      params: {
        // No projectSlug, projectID, or rollback parameters
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

  it('should return a valid MCP error response when project is not found', async () => {
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

  it('should return error when using projectID alone', async () => {
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
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should return error when rollback request is missing projectSlug', async () => {
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

  it('should fetch and return component versions when only projectSlug is provided', async () => {
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
          last_deployed_at: '2025-01-01T00:00:00Z',
        },
        {
          name: '0.9.0',
          namespace: 'prod',
          environment_id: 'env-1',
          is_live: false,
          pipeline_id: 'pipeline-2',
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
});
