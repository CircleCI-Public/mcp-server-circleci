import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listComponentVersions } from './handler.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('listComponentVersions handler', () => {
  const mockCircleCIClient = {
    deploys: {
      fetchComponentVersions: vi.fn(),
      fetchEnvironments: vi.fn(),
      fetchProjectComponents: vi.fn(),
    },
    projects: {
      getProject: vi.fn(),
      getProjectByID: vi.fn(),
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

  it('should return the formatted component versions when found', async () => {
    const mockComponentVersions = {
      items: [
        {
          id: 'version-1',
          component_id: 'test-component-id',
          environment_id: 'test-environment-id',
          version: '1.0.0',
          sha: 'abc123',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          is_live: true,
        },
        {
          id: 'version-2',
          component_id: 'test-component-id',
          environment_id: 'test-environment-id',
          version: '1.1.0',
          sha: 'def456',
          created_at: '2023-01-03T00:00:00Z',
          updated_at: '2023-01-04T00:00:00Z',
          is_live: false,
        },
      ],
      next_page_token: null,
    };

    // Mock project resolution
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'test-project-id',
      organization_id: 'test-org-id',
    });

    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue(mockComponentVersions);

    const args = {
      params: {
        projectSlug: 'gh/test-org/test-repo',
        componentID: 'test-component-id',
        environmentID: 'test-environment-id',
      },
    } as any;

    const response = await listComponentVersions(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Versions for the component:');
    expect(response.content[0].text).toContain(JSON.stringify(mockComponentVersions));
    
    expect(mockCircleCIClient.projects.getProject).toHaveBeenCalledTimes(1);
    expect(mockCircleCIClient.projects.getProject).toHaveBeenCalledWith({
      projectSlug: 'gh/test-org/test-repo',
    });
    expect(mockCircleCIClient.deploys.fetchComponentVersions).toHaveBeenCalledTimes(1);
    expect(mockCircleCIClient.deploys.fetchComponentVersions).toHaveBeenCalledWith({
        componentID: 'test-component-id',
        environmentID: 'test-environment-id',
      });
  });

  it('should return "No component versions found" when component versions list is empty', async () => {
    // Mock project resolution
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'test-project-id',
      organization_id: 'test-org-id',
    });

    mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue({
      items: [],
      next_page_token: null,
    });

    const args = {
      params: {
        projectSlug: 'gh/test-org/test-repo',
        componentID: 'test-component-id',
        environmentID: 'test-environment-id',
      },
    } as any;

    const response = await listComponentVersions(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toBe('No component versions found');
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Component versions API request failed';
    
    // Mock project resolution
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'test-project-id',
      organization_id: 'test-org-id',
    });

    mockCircleCIClient.deploys.fetchComponentVersions.mockRejectedValue(
      new Error(errorMessage),
    );

    const args = {
      params: {
        projectSlug: 'gh/test-org/test-repo',
        componentID: 'test-component-id',
        environmentID: 'test-environment-id',
      },
    } as any;

    const response = await listComponentVersions(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Failed to list component versions:');
    expect(response.content[0].text).toContain(errorMessage);
  });

  it('should handle non-Error exceptions gracefully', async () => {
    // Mock project resolution
    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'test-project-id',
      organization_id: 'test-org-id',
    });

    mockCircleCIClient.deploys.fetchComponentVersions.mockRejectedValue(
      'Unexpected error',
    );

    const args = {
      params: {
        projectSlug: 'gh/test-org/test-repo',
        componentID: 'test-component-id',
        environmentID: 'test-environment-id',
      },
    } as any;

    const response = await listComponentVersions(args, mockExtra);

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Failed to list component versions:');
    expect(response.content[0].text).toContain('Unknown error');
  });

  describe('Project resolution scenarios', () => {
    it('should use projectID and orgID directly when both are provided', async () => {
      const mockComponentVersions = {
        items: [
          {
            id: 'version-1',
            component_id: 'test-component-id',
            environment_id: 'test-environment-id',
            version: '1.0.0',
            sha: 'abc123',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            is_live: true,
          },
        ],
        next_page_token: null,
      };

      mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue(mockComponentVersions);

      const args = {
        params: {
          projectID: 'test-project-id',
          orgID: 'test-org-id',
          componentID: 'test-component-id',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Versions for the component:');
      
      // Should not call project resolution methods when both IDs are provided
      expect(mockCircleCIClient.projects.getProject).not.toHaveBeenCalled();
      expect(mockCircleCIClient.projects.getProjectByID).not.toHaveBeenCalled();
      expect(mockCircleCIClient.deploys.fetchComponentVersions).toHaveBeenCalledWith({
        componentID: 'test-component-id',
        environmentID: 'test-environment-id',
      });
    });

    it('should resolve orgID from projectID when only projectID is provided', async () => {
      const mockComponentVersions = {
        items: [
          {
            id: 'version-1',
            component_id: 'test-component-id',
            environment_id: 'test-environment-id',
            version: '1.0.0',
            sha: 'abc123',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            is_live: true,
          },
        ],
        next_page_token: null,
      };

      mockCircleCIClient.projects.getProjectByID.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'resolved-org-id',
      });

      mockCircleCIClient.deploys.fetchComponentVersions.mockResolvedValue(mockComponentVersions);

      const args = {
        params: {
          projectID: 'test-project-id',
          componentID: 'test-component-id',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Versions for the component:');
      
      expect(mockCircleCIClient.projects.getProjectByID).toHaveBeenCalledWith({
        projectID: 'test-project-id',
      });
      expect(mockCircleCIClient.projects.getProject).not.toHaveBeenCalled();
    });

    it('should handle project resolution errors for projectSlug', async () => {
      const errorMessage = 'Project not found';
      
      mockCircleCIClient.projects.getProject.mockRejectedValue(
        new Error(errorMessage),
      );

      const args = {
        params: {
          projectSlug: 'gh/invalid/repo',
          componentID: 'test-component-id',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('Failed to resolve project information for gh/invalid/repo');
      expect(response.content[0].text).toContain(errorMessage);
    });

    it('should handle project resolution errors for projectID', async () => {
      const errorMessage = 'Project ID not found';
      
      mockCircleCIClient.projects.getProjectByID.mockRejectedValue(
        new Error(errorMessage),
      );

      const args = {
        params: {
          projectID: 'invalid-project-id',
          componentID: 'test-component-id',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('Failed to resolve project information for project ID invalid-project-id');
      expect(response.content[0].text).toContain(errorMessage);
    });

    it('should return error when neither projectSlug nor projectID is provided', async () => {
      const args = {
        params: {
          componentID: 'test-component-id',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('Invalid request. Please specify either a project slug or a project ID.');
    });
  });

  describe('Missing environmentID scenarios', () => {
    it('should list environments when environmentID is not provided', async () => {
      const mockEnvironments = {
        items: [
          { id: 'env-1', name: 'production' },
          { id: 'env-2', name: 'staging' },
        ],
        next_page_token: null,
      };

      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'test-org-id',
      });

      mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue(mockEnvironments);

      const args = {
        params: {
          projectSlug: 'gh/test-org/test-repo',
          componentID: 'test-component-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Please provide an environmentID. Available environments:');
      expect(response.content[0].text).toContain('1. production (ID: env-1)');
      expect(response.content[0].text).toContain('2. staging (ID: env-2)');
      
      expect(mockCircleCIClient.deploys.fetchEnvironments).toHaveBeenCalledWith({
        orgID: 'test-org-id',
      });
    });

    it('should handle empty environments list', async () => {
      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'test-org-id',
      });

      mockCircleCIClient.deploys.fetchEnvironments.mockResolvedValue({
        items: [],
        next_page_token: null,
      });

      const args = {
        params: {
          projectSlug: 'gh/test-org/test-repo',
          componentID: 'test-component-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toBe('No environments found');
    });

    it('should handle fetchEnvironments API errors', async () => {
      const errorMessage = 'Failed to fetch environments';

      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'test-org-id',
      });

      mockCircleCIClient.deploys.fetchEnvironments.mockRejectedValue(
        new Error(errorMessage),
      );

      const args = {
        params: {
          projectSlug: 'gh/test-org/test-repo',
          componentID: 'test-component-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('Failed to list component versions:');
      expect(response.content[0].text).toContain(errorMessage);
    });
  });

  describe('Missing componentID scenarios', () => {
    it('should list components when componentID is not provided', async () => {
      const mockComponents = {
        items: [
          { id: 'comp-1', name: 'frontend' },
          { id: 'comp-2', name: 'backend' },
        ],
        next_page_token: null,
      };

      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'test-org-id',
      });

      mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue(mockComponents);

      const args = {
        params: {
          projectSlug: 'gh/test-org/test-repo',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Please provide a componentID. Available components:');
      expect(response.content[0].text).toContain('1. frontend (ID: comp-1)');
      expect(response.content[0].text).toContain('2. backend (ID: comp-2)');
      
      expect(mockCircleCIClient.deploys.fetchProjectComponents).toHaveBeenCalledWith({
        projectID: 'test-project-id',
        orgID: 'test-org-id',
      });
    });

    it('should handle empty components list', async () => {
      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'test-org-id',
      });

      mockCircleCIClient.deploys.fetchProjectComponents.mockResolvedValue({
        items: [],
        next_page_token: null,
      });

      const args = {
        params: {
          projectSlug: 'gh/test-org/test-repo',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toBe('No components found');
    });

    it('should handle fetchProjectComponents API errors', async () => {
      const errorMessage = 'Failed to fetch components';

      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'test-project-id',
        organization_id: 'test-org-id',
      });

      mockCircleCIClient.deploys.fetchProjectComponents.mockRejectedValue(
        new Error(errorMessage),
      );

      const args = {
        params: {
          projectSlug: 'gh/test-org/test-repo',
          environmentID: 'test-environment-id',
        },
      } as any;

      const response = await listComponentVersions(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('Failed to list component versions:');
      expect(response.content[0].text).toContain(errorMessage);
    });
  });
});
