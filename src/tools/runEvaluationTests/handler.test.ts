import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runEvaluationTests } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../lib/project-detection/index.js');
vi.mock('../../clients/client.js');

describe('runEvaluationTests handler', () => {
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
    const response = await runEvaluationTests(args, {
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
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'test: content',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
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
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'test: content',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('No branch provided');
  });

  it('should return a valid MCP error response when projectSlug is provided without branch', async () => {
    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'test: content',
          },
        ],
        // No branch provided
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain('Branch not provided');

    // Verify that CircleCI API was not called
    expect(mockCircleCIClient.projects.getProject).not.toHaveBeenCalled();
    expect(
      mockCircleCIClient.pipelines.getPipelineDefinitions,
    ).not.toHaveBeenCalled();
    expect(mockCircleCIClient.pipelines.runPipeline).not.toHaveBeenCalled();
  });

  it('should return a valid MCP error response when no prompt files are provided', async () => {
    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        branch: 'main',
        promptFiles: [], // Empty array
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain(
      'No prompt template files provided',
    );
    expect(response.content[0].text).toContain('./prompts directory');

    // Verify that CircleCI API was not called
    expect(mockCircleCIClient.projects.getProject).not.toHaveBeenCalled();
    expect(
      mockCircleCIClient.pipelines.getPipelineDefinitions,
    ).not.toHaveBeenCalled();
    expect(mockCircleCIClient.pipelines.runPipeline).not.toHaveBeenCalled();
  });

  it('should return a valid MCP error response when promptFiles is undefined', async () => {
    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        branch: 'main',
        // promptFiles is undefined
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain(
      'No prompt template files provided',
    );
    expect(response.content[0].text).toContain('./prompts directory');

    // Verify that CircleCI API was not called
    expect(mockCircleCIClient.projects.getProject).not.toHaveBeenCalled();
    expect(
      mockCircleCIClient.pipelines.getPipelineDefinitions,
    ).not.toHaveBeenCalled();
    expect(mockCircleCIClient.pipelines.runPipeline).not.toHaveBeenCalled();
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
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'test: content',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
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
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'test: content',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
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
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'test: content',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
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

  it('should run evaluation tests with multiple prompt files and correct parallelism', async () => {
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
        promptFiles: [
          {
            fileName: 'test1.prompt.json',
            fileContent: '{"template": "test content 1"}',
          },
          {
            fileName: 'test2.prompt.yml',
            fileContent: 'template: test content 2',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Pipeline run successfully');

    // Verify that the pipeline was called with correct configuration
    expect(mockCircleCIClient.pipelines.runPipeline).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      definitionId: 'def1',
      configContent: expect.stringContaining('parallelism: 2'), // Should match number of files
    });

    // Verify the config contains conditional file creation logic
    const configContent =
      mockCircleCIClient.pipelines.runPipeline.mock.calls[0][0].configContent;
    expect(configContent).toContain('CIRCLE_NODE_INDEX');
    expect(configContent).toContain('test1.prompt.json');
    expect(configContent).toContain('test2.prompt.yml');
    expect(configContent).toContain('python eval.py');

    // File names must be single-quoted at every interpolation site so they
    // cannot escape into shell (defense-in-depth alongside schema validation).
    expect(configContent).toContain("sudo tee '/prompts/test1.prompt.json'");
    expect(configContent).toContain("sudo tee '/prompts/test2.prompt.yml'");
    expect(configContent).toContain("python eval.py 'test1.prompt.json'");
    expect(configContent).toContain("python eval.py 'test2.prompt.yml'");
  });

  it('should process JSON files with proper formatting', async () => {
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
        projectSlug: 'gh/org/repo',
        branch: 'main',
        promptFiles: [
          {
            fileName: 'test.prompt.json',
            fileContent: '{"template":"test","vars":["a","b"]}',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    await runEvaluationTests(args, {
      signal: controller.signal,
    });

    // Verify that the pipeline was called
    expect(mockCircleCIClient.pipelines.runPipeline).toHaveBeenCalled();

    const configContent =
      mockCircleCIClient.pipelines.runPipeline.mock.calls[0][0].configContent;
    expect(configContent).toContain('parallelism: 1');
    expect(configContent).toContain('test.prompt.json');
  });

  it('should detect project from git remote and run evaluation tests', async () => {
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
        promptFiles: [
          {
            fileName: 'test.prompt.yml',
            fileContent: 'template: test content',
          },
        ],
      },
    } as any;

    const controller = new AbortController();
    const response = await runEvaluationTests(args, {
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
      configContent: expect.any(String),
    });
  });
});
