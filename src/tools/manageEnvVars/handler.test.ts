import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listEnvVars, createEnvVar, deleteEnvVar } from './handler.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('manageEnvVars handlers', () => {
  const mockCircleCIClient = {
    envVars: {
      listEnvVars: vi.fn(),
      createEnvVar: vi.fn(),
      deleteEnvVar: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(clientModule, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );
  });

  describe('listEnvVars', () => {
    it('should return error when projectSlug is missing', async () => {
      const args = { params: {} } as any;
      const controller = new AbortController();
      const response = await listEnvVars(args, { signal: controller.signal });

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('projectSlug');
    });

    it('should return message when no env vars found', async () => {
      mockCircleCIClient.envVars.listEnvVars.mockResolvedValue({
        items: [],
        next_page_token: null,
      });

      const args = { params: { projectSlug: 'gh/org/repo' } } as any;
      const controller = new AbortController();
      const response = await listEnvVars(args, { signal: controller.signal });

      expect(response.content[0].text).toContain('No environment variables');
      expect(mockCircleCIClient.envVars.listEnvVars).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
      });
    });

    it('should list env vars successfully', async () => {
      mockCircleCIClient.envVars.listEnvVars.mockResolvedValue({
        items: [
          { name: 'API_KEY', value: 'xxxx1234' },
          { name: 'DB_URL', value: 'xxxx5678' },
        ],
        next_page_token: null,
      });

      const args = { params: { projectSlug: 'gh/org/repo' } } as any;
      const controller = new AbortController();
      const response = await listEnvVars(args, { signal: controller.signal });

      expect(response.content[0].text).toContain('API_KEY');
      expect(response.content[0].text).toContain('DB_URL');
      expect(response).not.toHaveProperty('isError');
    });
  });

  describe('createEnvVar', () => {
    it('should return error when projectSlug is missing', async () => {
      const args = { params: { name: 'KEY', value: 'val' } } as any;
      const controller = new AbortController();
      const response = await createEnvVar(args, { signal: controller.signal });

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('projectSlug');
    });

    it('should return error when name is missing', async () => {
      const args = {
        params: { projectSlug: 'gh/org/repo', value: 'val' },
      } as any;
      const controller = new AbortController();
      const response = await createEnvVar(args, { signal: controller.signal });

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('name');
    });

    it('should return error when value is missing', async () => {
      const args = {
        params: { projectSlug: 'gh/org/repo', name: 'KEY' },
      } as any;
      const controller = new AbortController();
      const response = await createEnvVar(args, { signal: controller.signal });

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('value');
    });

    it('should create env var successfully', async () => {
      mockCircleCIClient.envVars.createEnvVar.mockResolvedValue({
        name: 'API_KEY',
        value: 'xxxx1234',
      });

      const args = {
        params: {
          projectSlug: 'gh/org/repo',
          name: 'API_KEY',
          value: 'my-secret-value',
        },
      } as any;
      const controller = new AbortController();
      const response = await createEnvVar(args, { signal: controller.signal });

      expect(response.content[0].text).toContain('created successfully');
      expect(response.content[0].text).toContain('API_KEY');
      expect(mockCircleCIClient.envVars.createEnvVar).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
        name: 'API_KEY',
        value: 'my-secret-value',
      });
    });
  });

  describe('deleteEnvVar', () => {
    it('should return error when projectSlug is missing', async () => {
      const args = { params: { name: 'KEY' } } as any;
      const controller = new AbortController();
      const response = await deleteEnvVar(args, { signal: controller.signal });

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('projectSlug');
    });

    it('should return error when name is missing', async () => {
      const args = { params: { projectSlug: 'gh/org/repo' } } as any;
      const controller = new AbortController();
      const response = await deleteEnvVar(args, { signal: controller.signal });

      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain('name');
    });

    it('should delete env var successfully', async () => {
      mockCircleCIClient.envVars.deleteEnvVar.mockResolvedValue({
        message: 'ok',
      });

      const args = {
        params: { projectSlug: 'gh/org/repo', name: 'API_KEY' },
      } as any;
      const controller = new AbortController();
      const response = await deleteEnvVar(args, { signal: controller.signal });

      expect(response.content[0].text).toContain('deleted successfully');
      expect(response.content[0].text).toContain('API_KEY');
      expect(mockCircleCIClient.envVars.deleteEnvVar).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
        name: 'API_KEY',
      });
    });
  });
});
