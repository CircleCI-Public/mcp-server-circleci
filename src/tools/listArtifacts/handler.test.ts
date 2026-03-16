import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listArtifacts } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../lib/project-detection/index.js');
vi.mock('../../clients/client.js');

describe('listArtifacts handler', () => {
  const mockCircleCIClient = {
    jobs: {
      getJobArtifacts: vi.fn(),
      getWorkflowJobs: vi.fn(),
    },
    pipelines: {
      getPipelines: vi.fn(),
      getPipelineByNumber: vi.fn(),
    },
    workflows: {
      getPipelineWorkflows: vi.fn(),
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

  describe('input validation', () => {
    it('should return a valid MCP error response when no inputs are provided', async () => {
      const response = await listArtifacts(
        { params: {} } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('Missing required inputs');
    });

    it('should return a valid MCP error response when projectSlug is provided without branch', async () => {
      const response = await listArtifacts(
        { params: { projectSlug: 'gh/org/repo' } } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('Branch not provided');

      // Verify that CircleCI API was not called
      expect(mockCircleCIClient.jobs.getJobArtifacts).not.toHaveBeenCalled();
      expect(mockCircleCIClient.pipelines.getPipelines).not.toHaveBeenCalled();
    });

    it('should return a valid MCP error response when project is not found via git detection', async () => {
      vi.spyOn(projectDetection, 'identifyProjectSlug').mockResolvedValue(
        undefined,
      );

      const response = await listArtifacts(
        {
          params: {
            workspaceRoot: '/workspace',
            gitRemoteURL: 'https://github.com/org/repo.git',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('Project not found');
    });
  });

  describe('single job artifacts (via URL with job number)', () => {
    beforeEach(() => {
      vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
        'gh/org/repo',
      );
      vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(42);
      vi.spyOn(projectDetection, 'getPipelineNumberFromURL').mockReturnValue(
        undefined,
      );
      vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(
        undefined,
      );
    });

    it('should return artifacts for a specific job via URL', async () => {
      mockCircleCIClient.jobs.getJobArtifacts.mockResolvedValue([
        {
          path: 'dist/app.js',
          node_index: 0,
          url: 'https://circleci.com/artifacts/dist/app.js',
        },
        {
          path: 'coverage/report.html',
          node_index: 0,
          url: 'https://circleci.com/artifacts/coverage/report.html',
        },
      ]);

      const response = await listArtifacts(
        {
          params: {
            projectURL:
              'https://app.circleci.com/pipelines/gh/org/repo/10/workflows/abc/jobs/42',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('## Job 42');
      expect(response.content[0].text).toContain('- **dist/app.js**');
      expect(response.content[0].text).toContain('- **coverage/report.html**');

      expect(mockCircleCIClient.jobs.getJobArtifacts).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
        jobNumber: 42,
      });

      // Verify that pipeline/workflow APIs were not called
      expect(
        mockCircleCIClient.pipelines.getPipelines,
      ).not.toHaveBeenCalled();
      expect(
        mockCircleCIClient.pipelines.getPipelineByNumber,
      ).not.toHaveBeenCalled();
      expect(
        mockCircleCIClient.workflows.getPipelineWorkflows,
      ).not.toHaveBeenCalled();
    });

    it('should return no artifacts message when job has no artifacts', async () => {
      mockCircleCIClient.jobs.getJobArtifacts.mockResolvedValue([]);

      const response = await listArtifacts(
        {
          params: {
            projectURL:
              'https://app.circleci.com/pipelines/gh/org/repo/10/workflows/abc/jobs/42',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('No artifacts found');
    });

    it('should return a valid MCP error response when fetching artifacts fails', async () => {
      mockCircleCIClient.jobs.getJobArtifacts.mockRejectedValue(
        new Error('404 Not Found'),
      );

      const response = await listArtifacts(
        {
          params: {
            projectURL:
              'https://app.circleci.com/pipelines/gh/org/repo/10/workflows/abc/jobs/42',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('Failed to fetch artifacts');
      expect(response.content[0].text).toContain('404 Not Found');
    });
  });

  describe('pipeline artifacts (via projectSlug and branch)', () => {
    const setupPipelineMocks = () => {
      mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
        { id: 'pipeline-1', project_slug: 'gh/org/repo', number: 10 },
      ]);

      mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue([
        {
          id: 'workflow-1',
          name: 'build',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
      ]);
    };

    it('should fetch artifacts for all jobs in the latest pipeline', async () => {
      setupPipelineMocks();

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: 100 },
        { id: 'job-2', job_number: 101 },
      ]);

      mockCircleCIClient.jobs.getJobArtifacts
        .mockResolvedValueOnce([
          {
            path: 'dist/app.js',
            node_index: 0,
            url: 'https://circleci.com/artifacts/dist/app.js',
          },
        ])
        .mockResolvedValueOnce([
          {
            path: 'test-results/results.xml',
            node_index: 0,
            url: 'https://circleci.com/artifacts/test-results/results.xml',
          },
        ]);

      const response = await listArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('## Job 100');
      expect(response.content[0].text).toContain('- **dist/app.js**');
      expect(response.content[0].text).toContain('## Job 101');
      expect(response.content[0].text).toContain(
        '- **test-results/results.xml**',
      );

      // Verify that project detection functions were not called
      expect(projectDetection.getProjectSlugFromURL).not.toHaveBeenCalled();
      expect(projectDetection.identifyProjectSlug).not.toHaveBeenCalled();
    });

    it('should return a valid MCP error response when no pipelines are found', async () => {
      mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([]);

      const response = await listArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('No pipelines found');
    });

    it('should handle jobs with no job_number gracefully', async () => {
      setupPipelineMocks();

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: undefined },
      ]);

      const response = await listArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('No artifacts found');
      expect(mockCircleCIClient.jobs.getJobArtifacts).not.toHaveBeenCalled();
    });

    it('should silently skip jobs that return 404 when fetching artifacts', async () => {
      setupPipelineMocks();

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: 100 },
        { id: 'job-2', job_number: 101 },
      ]);

      mockCircleCIClient.jobs.getJobArtifacts
        .mockResolvedValueOnce([
          {
            path: 'dist/app.js',
            node_index: 0,
            url: 'https://circleci.com/artifacts/dist/app.js',
          },
        ])
        .mockRejectedValueOnce(new Error('404 Not Found'));

      const response = await listArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('## Job 100');
      expect(response.content[0].text).toContain('- **dist/app.js**');
      expect(response.content[0].text).not.toContain('Job 101');
    });

    it('should silently skip jobs that return 429 when fetching artifacts', async () => {
      setupPipelineMocks();

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: 100 },
        { id: 'job-2', job_number: 101 },
      ]);

      mockCircleCIClient.jobs.getJobArtifacts
        .mockResolvedValueOnce([
          {
            path: 'dist/app.js',
            node_index: 0,
            url: 'https://circleci.com/artifacts/dist/app.js',
          },
        ])
        .mockRejectedValueOnce(new Error('429 Too Many Requests'));

      const response = await listArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0].text).toContain('## Job 100');
      expect(response.content[0].text).toContain('- **dist/app.js**');
      expect(response.content[0].text).not.toContain('Job 101');
    });

    it('should fetch artifacts across multiple workflows', async () => {
      mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
        { id: 'pipeline-1', project_slug: 'gh/org/repo', number: 10 },
      ]);

      mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue([
        {
          id: 'workflow-1',
          name: 'build',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
        {
          id: 'workflow-2',
          name: 'deploy',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
      ]);

      mockCircleCIClient.jobs.getWorkflowJobs
        .mockResolvedValueOnce([{ id: 'job-1', job_number: 100 }])
        .mockResolvedValueOnce([{ id: 'job-2', job_number: 200 }]);

      mockCircleCIClient.jobs.getJobArtifacts
        .mockResolvedValueOnce([
          {
            path: 'build/app.js',
            node_index: 0,
            url: 'https://circleci.com/artifacts/build/app.js',
          },
        ])
        .mockResolvedValueOnce([
          {
            path: 'deploy/manifest.yaml',
            node_index: 0,
            url: 'https://circleci.com/artifacts/deploy/manifest.yaml',
          },
        ]);

      const response = await listArtifacts(
        {
          params: {
            projectSlug: 'gh/org/repo',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(response.content[0].text).toContain('## Job 100');
      expect(response.content[0].text).toContain('- **build/app.js**');
      expect(response.content[0].text).toContain('## Job 200');
      expect(response.content[0].text).toContain('- **deploy/manifest.yaml**');

      expect(mockCircleCIClient.jobs.getWorkflowJobs).toHaveBeenCalledTimes(2);
      expect(mockCircleCIClient.jobs.getWorkflowJobs).toHaveBeenCalledWith({
        workflowId: 'workflow-1',
      });
      expect(mockCircleCIClient.jobs.getWorkflowJobs).toHaveBeenCalledWith({
        workflowId: 'workflow-2',
      });
    });
  });

  describe('pipeline artifacts (via URL)', () => {
    it('should fetch artifacts using pipeline number from URL', async () => {
      vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
        'gh/org/repo',
      );
      vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(
        undefined,
      );
      vi.spyOn(
        projectDetection,
        'getPipelineNumberFromURL',
      ).mockReturnValue(10);
      vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(
        undefined,
      );

      mockCircleCIClient.pipelines.getPipelineByNumber.mockResolvedValue({
        id: 'pipeline-1',
        project_slug: 'gh/org/repo',
        number: 10,
      });

      mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue([
        {
          id: 'workflow-1',
          name: 'build',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
      ]);

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: 55 },
      ]);

      mockCircleCIClient.jobs.getJobArtifacts.mockResolvedValue([
        {
          path: 'build/output.zip',
          node_index: 0,
          url: 'https://circleci.com/artifacts/build/output.zip',
        },
      ]);

      const response = await listArtifacts(
        {
          params: {
            projectURL:
              'https://app.circleci.com/pipelines/gh/org/repo/10',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(typeof response.content[0].text).toBe('string');
      expect(response.content[0].text).toContain('## Job 55');
      expect(response.content[0].text).toContain('- **build/output.zip**');

      expect(
        mockCircleCIClient.pipelines.getPipelineByNumber,
      ).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
        pipelineNumber: 10,
      });

      // Should not fall through to getPipelines when getPipelineByNumber succeeds
      expect(
        mockCircleCIClient.pipelines.getPipelines,
      ).not.toHaveBeenCalled();
    });

    it('should fall back to getPipelines when getPipelineByNumber returns undefined', async () => {
      vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
        'gh/org/repo',
      );
      vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(
        undefined,
      );
      vi.spyOn(
        projectDetection,
        'getPipelineNumberFromURL',
      ).mockReturnValue(10);
      vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(
        undefined,
      );

      mockCircleCIClient.pipelines.getPipelineByNumber.mockResolvedValue(
        undefined,
      );

      mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
        { id: 'pipeline-1', project_slug: 'gh/org/repo', number: 10 },
      ]);

      mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue([
        {
          id: 'workflow-1',
          name: 'build',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
      ]);

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: 55 },
      ]);

      mockCircleCIClient.jobs.getJobArtifacts.mockResolvedValue([]);

      const response = await listArtifacts(
        {
          params: {
            projectURL:
              'https://app.circleci.com/pipelines/gh/org/repo/10',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');

      expect(
        mockCircleCIClient.pipelines.getPipelineByNumber,
      ).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
        pipelineNumber: 10,
      });
      expect(mockCircleCIClient.pipelines.getPipelines).toHaveBeenCalled();
    });

    it('should use branchFromURL when available', async () => {
      vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
        'gh/org/repo',
      );
      vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(
        undefined,
      );
      vi.spyOn(
        projectDetection,
        'getPipelineNumberFromURL',
      ).mockReturnValue(undefined);
      vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(
        'develop',
      );

      mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
        { id: 'pipeline-1', project_slug: 'gh/org/repo', number: 10 },
      ]);

      mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue([
        {
          id: 'workflow-1',
          name: 'build',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
      ]);

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([]);

      const response = await listArtifacts(
        {
          params: {
            projectURL:
              'https://app.circleci.com/pipelines/gh/org/repo',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');

      expect(mockCircleCIClient.pipelines.getPipelines).toHaveBeenCalledWith({
        projectSlug: 'gh/org/repo',
        branch: 'develop',
      });
    });
  });

  describe('project detection via git remote', () => {
    it('should use git detection to resolve the project slug', async () => {
      vi.spyOn(projectDetection, 'identifyProjectSlug').mockResolvedValue(
        'gh/org/repo',
      );

      mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
        { id: 'pipeline-1', project_slug: 'gh/org/repo', number: 10 },
      ]);

      mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue([
        {
          id: 'workflow-1',
          name: 'build',
          status: 'success',
          created_at: '2024-01-01',
          pipeline_number: 10,
          project_slug: 'gh/org/repo',
          pipeline_id: 'pipeline-1',
        },
      ]);

      mockCircleCIClient.jobs.getWorkflowJobs.mockResolvedValue([
        { id: 'job-1', job_number: 100 },
      ]);

      mockCircleCIClient.jobs.getJobArtifacts.mockResolvedValue([]);

      const response = await listArtifacts(
        {
          params: {
            workspaceRoot: '/workspace',
            gitRemoteURL: 'https://github.com/org/repo.git',
            branch: 'main',
          },
        } as any,
        mockExtra,
      );

      expect(response).toHaveProperty('content');
      expect(response).not.toHaveProperty('isError');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');

      expect(projectDetection.identifyProjectSlug).toHaveBeenCalledWith({
        gitRemoteURL: 'https://github.com/org/repo.git',
      });

      // Verify that URL-based detection was not called
      expect(
        projectDetection.getProjectSlugFromURL,
      ).not.toHaveBeenCalled();
    });
  });
});
