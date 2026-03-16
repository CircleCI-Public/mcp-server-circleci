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

  it('should return an error when no inputs are provided', async () => {
    const response = await listArtifacts(
      { params: {} } as any,
      mockExtra,
    );

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Missing required inputs');
  });

  it('should return an error when projectSlug is provided without branch', async () => {
    const response = await listArtifacts(
      { params: { projectSlug: 'gh/org/repo' } } as any,
      mockExtra,
    );

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Branch not provided');
  });

  it('should return an error when project is not found via git detection', async () => {
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

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Project not found');
  });

  it('should return artifacts for a specific job via URL', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(42);
    vi.spyOn(projectDetection, 'getPipelineNumberFromURL').mockReturnValue(
      undefined,
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(undefined);

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

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('dist/app.js');
    expect(response.content[0].text).toContain('coverage/report.html');
    expect(response.content[0].text).toContain('Job 42');

    expect(mockCircleCIClient.jobs.getJobArtifacts).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      jobNumber: 42,
    });
  });

  it('should return no artifacts message when job has no artifacts', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(42);
    vi.spyOn(projectDetection, 'getPipelineNumberFromURL').mockReturnValue(
      undefined,
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(undefined);

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

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('No artifacts found');
  });

  it('should return an error when fetching artifacts fails for a specific job', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(42);
    vi.spyOn(projectDetection, 'getPipelineNumberFromURL').mockReturnValue(
      undefined,
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(undefined);

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

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('Failed to fetch artifacts');
  });

  it('should fetch artifacts for all jobs in the latest pipeline using projectSlug and branch', async () => {
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

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('dist/app.js');
    expect(response.content[0].text).toContain('test-results/results.xml');
    expect(response.content[0].text).toContain('Job 100');
    expect(response.content[0].text).toContain('Job 101');
  });

  it('should return an error when no pipelines are found', async () => {
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

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('No pipelines found');
  });

  it('should handle jobs with no job_number gracefully', async () => {
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

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('No artifacts found');
    expect(mockCircleCIClient.jobs.getJobArtifacts).not.toHaveBeenCalled();
  });

  it('should fetch artifacts using pipeline number from URL', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(
      undefined,
    );
    vi.spyOn(projectDetection, 'getPipelineNumberFromURL').mockReturnValue(10);
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(undefined);

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

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('build/output.zip');
    expect(response.content[0].text).toContain('Job 55');

    expect(mockCircleCIClient.pipelines.getPipelineByNumber).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      pipelineNumber: 10,
    });
  });

  it('should silently skip jobs that return 404 when fetching artifacts across a pipeline', async () => {
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

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('dist/app.js');
    expect(response.content[0].text).toContain('Job 100');
  });

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

    expect(response).not.toHaveProperty('isError');
    expect(projectDetection.identifyProjectSlug).toHaveBeenCalledWith({
      gitRemoteURL: 'https://github.com/org/repo.git',
    });
  });
});
