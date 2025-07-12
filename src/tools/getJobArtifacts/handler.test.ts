import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getJobArtifacts } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as clientModule from '../../clients/client.js';
import type { Artifact } from '../../clients/circleci/artifacts.js';

// Mock the dependencies
vi.mock('../../lib/project-detection/index.js');
vi.mock('../../clients/client.js');

describe('getJobArtifacts', () => {
  const mockArtifacts: Artifact[] = [
    {
      path: 'test-results/junit.xml',
      pretty_path: 'test-results/junit.xml',
      node_index: 0,
      url: 'https://artifacts.circleci.com/0/test-results/junit.xml',
    },
    {
      path: 'coverage/lcov.info',
      pretty_path: 'coverage/lcov.info',
      node_index: 0,
      url: 'https://artifacts.circleci.com/0/coverage/lcov.info',
    },
    {
      path: 'logs/app.log',
      pretty_path: 'logs/app.log',
      node_index: 1,
      url: 'https://artifacts.circleci.com/1/logs/app.log',
    },
  ];

  const mockCircleCIClient = {
    artifacts: {
      getAllJobArtifacts: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(clientModule, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );
  });

  describe('Input validation', () => {
    it('should return error when no inputs are provided', async () => {
      const controller = new AbortController();
      const result = await getJobArtifacts(
        { params: {} },
        { signal: controller.signal },
      );

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('Invalid input combination');
    });

    it('should return error when projectSlug is provided without branch', async () => {
      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            jobNumber: 12345,
          },
        },
        { signal: controller.signal },
      );

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('Branch is required');
    });

    it('should return error when jobURL cannot be parsed', async () => {
      vi.mocked(projectDetection.getProjectSlugFromURL).mockReturnValue('');

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            jobURL: 'https://invalid.url.com',
          },
        },
        { signal: controller.signal },
      );

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain(
        'Failed to extract project information',
      );
    });

    it('should return error when job number cannot be extracted from URL', async () => {
      vi.mocked(projectDetection.getProjectSlugFromURL).mockReturnValue(
        'gh/org/repo',
      );
      vi.mocked(projectDetection.getJobNumberFromURL).mockReturnValue(undefined);

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            jobURL: 'https://app.circleci.com/pipelines/gh/org/repo',
          },
        },
        { signal: controller.signal },
      );

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('Failed to extract job number');
    });
  });

  describe('Success cases', () => {
    it('should fetch artifacts using projectSlug and jobNumber', async () => {
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockResolvedValue(
        mockArtifacts,
      );

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
            jobNumber: 12345,
          },
        },
        { signal: controller.signal },
      );

      expect(
        mockCircleCIClient.artifacts.getAllJobArtifacts,
      ).toHaveBeenCalledWith('gh/org/repo', 12345);

      expect(result).toHaveProperty('content');
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('# Artifacts for Job #12345');
      expect(result.content[0].text).toContain('Found 3 artifacts:');
      expect(result.content[0].text).toContain('test-results/junit.xml');
      expect(result.content[0].text).toContain('coverage/lcov.info');
      expect(result.content[0].text).toContain('logs/app.log');
    });

    it('should fetch artifacts using job URL', async () => {
      vi.mocked(projectDetection.getProjectSlugFromURL).mockReturnValue(
        'gh/org/repo',
      );
      vi.mocked(projectDetection.getJobNumberFromURL).mockReturnValue(12345);
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockResolvedValue(
        mockArtifacts,
      );

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            jobURL:
              'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc/jobs/12345',
          },
        },
        { signal: controller.signal },
      );

      expect(
        mockCircleCIClient.artifacts.getAllJobArtifacts,
      ).toHaveBeenCalledWith('gh/org/repo', 12345);

      expect(result.content[0].text).toContain('# Artifacts for Job #12345');
      expect(result.content[0].text).toContain('Found 3 artifacts:');
    });

    it('should fetch artifacts using workspace detection', async () => {
      vi.mocked(projectDetection.identifyProjectSlug).mockResolvedValue(
        'gh/org/repo',
      );
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockResolvedValue(
        mockArtifacts,
      );

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            workspaceRoot: '/Users/test/project',
            gitRemoteURL: 'https://github.com/org/repo.git',
            jobNumber: 12345,
          },
        },
        { signal: controller.signal },
      );

      expect(projectDetection.identifyProjectSlug).toHaveBeenCalledWith({
        gitRemoteURL: 'https://github.com/org/repo.git',
      });
      expect(
        mockCircleCIClient.artifacts.getAllJobArtifacts,
      ).toHaveBeenCalledWith('gh/org/repo', 12345);

      expect(result.content[0].text).toContain('Branch: main');
    });

    it('should filter artifacts by path prefix', async () => {
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockResolvedValue(
        mockArtifacts,
      );

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
            jobNumber: 12345,
            artifactPath: 'coverage/',
          },
        },
        { signal: controller.signal },
      );

      expect(result.content[0].text).toContain('Filter: coverage/');
      expect(result.content[0].text).toContain('Found 1 artifact:');
      expect(result.content[0].text).toContain('coverage/lcov.info');
      expect(result.content[0].text).not.toContain('test-results/junit.xml');
      expect(result.content[0].text).not.toContain('logs/app.log');
    });

    it('should handle empty artifact list', async () => {
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockResolvedValue([]);

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
            jobNumber: 12345,
          },
        },
        { signal: controller.signal },
      );

      expect(result.content[0].text).toBe('No artifacts found for job #12345');
    });

    it('should handle empty filtered artifact list', async () => {
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockResolvedValue(
        mockArtifacts,
      );

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
            jobNumber: 12345,
            artifactPath: 'nonexistent/',
          },
        },
        { signal: controller.signal },
      );

      expect(result.content[0].text).toBe(
        'No artifacts found matching path prefix "nonexistent/" for job #12345',
      );
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockCircleCIClient.artifacts.getAllJobArtifacts.mockRejectedValue(
        new Error('API request failed: 404 Not Found'),
      );

      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
            jobNumber: 12345,
          },
        },
        { signal: controller.signal },
      );

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('Failed to fetch artifacts');
      expect(result.content[0].text).toContain(
        'API request failed: 404 Not Found',
      );
      expect(result.content[0].text).toContain('Please ensure:');
    });

    it('should handle workspace detection error without gitRemoteURL', async () => {
      const controller = new AbortController();
      const result = await getJobArtifacts(
        {
          params: {
            workspaceRoot: '/Users/test/project',
            jobNumber: 12345,
          },
        },
        { signal: controller.signal },
      );

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0].text).toContain('Git remote URL is required');
    });
  });
});
