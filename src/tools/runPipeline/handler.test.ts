import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../lib/project-detection/index.js');
vi.mock('../../clients/client.js');

describe('runPipeline handler', () => {
  const mockCircleCIClient = {
    projects: {
      getProject: vi.fn(),
    },
    pipelines: {
      getPipelineDefinitions: vi.fn(),
      runPipeline: vi.fn(),
    },
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

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should return a valid MCP error response when project is not found', async () => {
    vi.spyOn(projectDetection, 'identifyProjectSlug').mockResolvedValue(
      undefined,
    );

    const args = {
      params: {
        workspaceRoot: '/workspace',
        gitRemoteURL: 'https://github.com/org/repo.git',
        branch: 'main',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should return a valid MCP error response when no branch is provided', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue(undefined);

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('No branch provided');
  });

  it('should return a valid MCP error response when no pipeline definitions are found', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue('main');

    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
    });
    mockCircleCIClient.pipelines.getPipelineDefinitions.mockResolvedValue([]);

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('No pipeline definitions found');
  });

  it('should return a list of pipeline choices when multiple pipeline definitions are found and no choice is provided', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue('main');

    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
    });
    mockCircleCIClient.pipelines.getPipelineDefinitions.mockResolvedValue([
      { id: 'def1', name: 'Pipeline 1' },
      { id: 'def2', name: 'Pipeline 2' },
    ]);

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain(
      'Multiple pipeline definitions found',
    );
    expect(response.content[0].text).toContain('Pipeline 1');
    expect(response.content[0].text).toContain('Pipeline 2');
  });

  it('should return an error when an invalid pipeline choice is provided', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue('main');

    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
    });
    mockCircleCIClient.pipelines.getPipelineDefinitions.mockResolvedValue([
      { id: 'def1', name: 'Pipeline 1' },
      { id: 'def2', name: 'Pipeline 2' },
    ]);

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
        pipelineChoiceName: 'Non-existent Pipeline',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain(
      'Pipeline definition with name Non-existent Pipeline not found',
    );
  });

  it('should run a pipeline with a specific choice when valid pipeline choice is provided', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue('main');

    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
    });
    mockCircleCIClient.pipelines.getPipelineDefinitions.mockResolvedValue([
      { id: 'def1', name: 'Pipeline 1' },
      { id: 'def2', name: 'Pipeline 2' },
    ]);
    mockCircleCIClient.pipelines.runPipeline.mockResolvedValue({
      number: 123,
      state: 'pending',
      id: 'pipeline-id',
    });

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
        pipelineChoiceName: 'Pipeline 2',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Pipeline run successfully');
    expect(mockCircleCIClient.pipelines.runPipeline).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      definitionId: 'def2',
    });
  });

  it('should run a pipeline with the first choice when only one pipeline definition is found', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getBranchFromURL').mockReturnValue('main');

    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
    });
    mockCircleCIClient.pipelines.getPipelineDefinitions.mockResolvedValue([
      { id: 'def1', name: 'Pipeline 1' },
    ]);
    mockCircleCIClient.pipelines.runPipeline.mockResolvedValue({
      number: 123,
      state: 'pending',
      id: 'pipeline-id',
    });

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Pipeline run successfully');
    expect(mockCircleCIClient.pipelines.runPipeline).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      definitionId: 'def1',
    });
  });

  it('should detect project from git remote and run pipeline', async () => {
    vi.spyOn(projectDetection, 'identifyProjectSlug').mockResolvedValue(
      'gh/org/repo',
    );

    mockCircleCIClient.projects.getProject.mockResolvedValue({
      id: 'project-id',
    });
    mockCircleCIClient.pipelines.getPipelineDefinitions.mockResolvedValue([
      { id: 'def1', name: 'Pipeline 1' },
    ]);
    mockCircleCIClient.pipelines.runPipeline.mockResolvedValue({
      number: 123,
      state: 'pending',
      id: 'pipeline-id',
    });

    const args = {
      params: {
        workspaceRoot: '/workspace',
        gitRemoteURL: 'https://github.com/org/repo.git',
        branch: 'feature-branch',
      },
    } as any;

    const controller = new AbortController();
    const response = await runPipeline(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Pipeline run successfully');
    expect(mockCircleCIClient.pipelines.runPipeline).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'feature-branch',
      definitionId: 'def1',
    });
  });
});
