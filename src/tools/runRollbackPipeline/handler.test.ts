import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runRollbackPipeline } from './handler.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('runRollbackPipeline handler', () => {
  const mockCircleCIClient = {
    deploys: {
      runRollbackPipeline: vi.fn(),
      fetchProjectDeploySettings: vi.fn(),
    },
    projects: {
      getProject: vi.fn(),
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

  describe('successful rollback pipeline execution', () => {
    it('should initiate rollback pipeline with all required parameters', async () => {
      const mockRollbackResponse = {
        id: 'rollback-123',
        rollback_type: 'PIPELINE',
      };

      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: 'rollback-def-123',
      });
      mockCircleCIClient.deploys.runRollbackPipeline.mockResolvedValue(mockRollbackResponse);

      const args = {
        params: {
          projectID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          environmentName: 'production',
          componentName: 'frontend',
          currentVersion: 'v1.2.0',
          targetVersion: 'v1.1.0',
          namespace: 'web-app',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toBe('Rollback initiated successfully. ID: rollback-123, Type: PIPELINE');
      
      expect(mockCircleCIClient.deploys.runRollbackPipeline).toHaveBeenCalledTimes(1);
      expect(mockCircleCIClient.deploys.runRollbackPipeline).toHaveBeenCalledWith({
        projectID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        rollbackRequest: {
          environment_name: 'production',
          component_name: 'frontend',
          current_version: 'v1.2.0',
          target_version: 'v1.1.0',
          namespace: 'web-app',
        },
      });
    });

    it('should initiate rollback pipeline with optional reason parameter', async () => {
      const mockRollbackResponse = {
        id: 'rollback-456',
        rollback_type: 'PIPELINE',
      };

      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: 'rollback-def-456',
      });
      mockCircleCIClient.deploys.runRollbackPipeline.mockResolvedValue(mockRollbackResponse);

      const args = {
        params: {
          projectID: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
          environmentName: 'staging',
          componentName: 'backend',
          currentVersion: 'v2.1.0',
          targetVersion: 'v2.0.0',
          namespace: 'api-service',
          reason: 'Critical bug fix required',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toBe('Rollback initiated successfully. ID: rollback-456, Type: PIPELINE');
      
      expect(mockCircleCIClient.deploys.runRollbackPipeline).toHaveBeenCalledWith({
        projectID: 'b2c3d4e5-f6g7-8901-bcde-fg2345678901',
        rollbackRequest: {
          environment_name: 'staging',
          component_name: 'backend',
          current_version: 'v2.1.0',
          target_version: 'v2.0.0',
          namespace: 'api-service',
          reason: 'Critical bug fix required',
        },
      });
    });

    it('should initiate rollback pipeline with optional parameters object', async () => {
      const mockRollbackResponse = {
        id: 'rollback-789',
        rollback_type: 'PIPELINE',
      };

      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: 'rollback-def-789',
      });
      mockCircleCIClient.deploys.runRollbackPipeline.mockResolvedValue(mockRollbackResponse);

      const args = {
        params: {
          projectID: 'c3d4e5f6-g7h8-9012-cdef-gh3456789012',
          environmentName: 'production',
          componentName: 'database',
          currentVersion: 'v3.2.0',
          targetVersion: 'v3.1.0',
          namespace: 'db-cluster',
          reason: 'Performance regression',
          parameters: {
            skip_migration: true,
            notify_team: 'devops',
          },
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toBe('Rollback initiated successfully. ID: rollback-789, Type: PIPELINE');
      
      expect(mockCircleCIClient.deploys.runRollbackPipeline).toHaveBeenCalledWith({
        projectID: 'c3d4e5f6-g7h8-9012-cdef-gh3456789012',
        rollbackRequest: {
          environment_name: 'production',
          component_name: 'database',
          current_version: 'v3.2.0',
          target_version: 'v3.1.0',
          namespace: 'db-cluster',
          reason: 'Performance regression',
          parameters: {
            skip_migration: true,
            notify_team: 'devops',
          },
        },
      });
    });

    it('should initiate rollback pipeline using projectSlug', async () => {
      const mockRollbackResponse = {
        id: 'rollback-slug-123',
        rollback_type: 'PIPELINE',
      };

      mockCircleCIClient.projects.getProject.mockResolvedValue({
        id: 'resolved-project-id-123',
        organization_id: 'org-id-123',
      });
      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: 'rollback-def-slug-123',
      });
      mockCircleCIClient.deploys.runRollbackPipeline.mockResolvedValue(mockRollbackResponse);

      const args = {
        params: {
          projectSlug: 'gh/organization/project',
          environmentName: 'production',
          componentName: 'frontend',
          currentVersion: 'v1.2.0',
          targetVersion: 'v1.1.0',
          namespace: 'web-app',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toBe('Rollback initiated successfully. ID: rollback-slug-123, Type: PIPELINE');
      
      expect(mockCircleCIClient.projects.getProject).toHaveBeenCalledWith({
        projectSlug: 'gh/organization/project',
      });
      expect(mockCircleCIClient.deploys.runRollbackPipeline).toHaveBeenCalledWith({
        projectID: 'resolved-project-id-123',
        rollbackRequest: {
          environment_name: 'production',
          component_name: 'frontend',
          current_version: 'v1.2.0',
          target_version: 'v1.1.0',
          namespace: 'web-app',
        },
      });
    });
  });

  describe('error handling', () => {
    it('should return error when API call fails with Error object', async () => {
      const errorMessage = 'Rollback pipeline not configured for this project';
      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: 'rollback-def-error',
      });
      mockCircleCIClient.deploys.runRollbackPipeline.mockRejectedValue(new Error(errorMessage));

      const args = {
        params: {
          projectID: 'e5f6g7h8-i9j0-1234-efgh-ij5678901234',
          environment_name: 'production',
          componentName: 'frontend',
          currentVersion: 'v2.0.0',
          targetVersion: 'v1.9.0',
          namespace: 'app',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('Failed to initiate rollback:');
      expect(response.content[0].text).toContain('Rollback pipeline not configured for this project');
    });

    it('should return error when API call fails with non-Error object', async () => {
      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: 'rollback-def-error2',
      });
      mockCircleCIClient.deploys.runRollbackPipeline.mockRejectedValue('String error');

      const args = {
        params: {
          projectID: 'f6g7h8i9-j0k1-2345-fghi-jk6789012345',
          environment_name: 'staging',
          component_name: 'backend',
          current_version: 'v3.0.0',
          target_version: 'v2.9.0',
          namespace: 'api',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Failed to initiate rollback:');
      expect(response.content[0].text).toContain('Unknown error');
    });

    it('should return error when projectSlug resolution fails', async () => {
      const errorMessage = 'Project not found';
      mockCircleCIClient.projects.getProject.mockRejectedValue(new Error(errorMessage));

      const args = {
        params: {
          projectSlug: 'gh/invalid/project',
          environmentName: 'production',
          componentName: 'frontend',
          currentVersion: 'v1.2.0',
          targetVersion: 'v1.1.0',
          namespace: 'web-app',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Failed to resolve project information for gh/invalid/project');
      expect(response.content[0].text).toContain('Project not found');
    });

    it('should return error when neither projectSlug nor projectID provided', async () => {
      const args = {
        params: {
          environmentName: 'production',
          componentName: 'frontend',
          currentVersion: 'v1.2.0',
          targetVersion: 'v1.1.0',
          namespace: 'web-app',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('Either projectSlug or projectID must be provided');
    });

    it('should return the appropriate message when no rollback pipeline definition is configured', async () => {
      mockCircleCIClient.deploys.fetchProjectDeploySettings.mockResolvedValue({
        rollback_pipeline_definition_id: null,
      });

      const args = {
        params: {
          projectID: 'test-project-id',
          environmentName: 'production',
          componentName: 'frontend',
          currentVersion: 'v1.2.0',
          targetVersion: 'v1.1.0',
          namespace: 'web-app',
        },
      } as any;

      const response = await runRollbackPipeline(args, mockExtra);

      expect(response).toHaveProperty('content');
      expect(response.content[0].text).toContain('No rollback pipeline definition found for this project');
      expect(response.content[0].text).toContain('https://circleci.com/docs/deploy/rollback-a-project-using-the-rollback-pipeline/');
    });
  });
});
