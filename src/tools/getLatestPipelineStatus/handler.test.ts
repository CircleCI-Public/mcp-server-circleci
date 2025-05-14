import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLatestPipelineStatus } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as getLatestPipelineWorkflowsModule from '../../lib/latest-pipeline/getLatestPipelineWorkflows.js';
import * as formatLatestPipelineStatusModule from '../../lib/latest-pipeline/formatLatestPipelineStatus.js';
import { McpSuccessResponse } from '../../lib/mcpResponse.js';

// Mock dependencies
vi.mock('../../lib/project-detection/index.js');
vi.mock('../../lib/latest-pipeline/getLatestPipelineWorkflows.js');
vi.mock('../../lib/latest-pipeline/formatLatestPipelineStatus.js');

describe('getLatestPipelineStatus handler', () => {
  const mockWorkflows = [
    {
      id: 'workflow-id-1',
      name: 'build-and-test',
      status: 'success',
      created_at: '2023-01-01T12:00:00Z',
      stopped_at: '2023-01-01T12:05:00Z',
      pipeline_number: 123,
      project_slug: 'gh/circleci/project',
    },
  ];

  const mockFormattedResponse: McpSuccessResponse = {
    content: [
      {
        type: 'text' as const,
        text: 'Formatted pipeline status',
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup default mocks
    vi.mocked(projectDetection.getProjectSlugFromURL).mockReturnValue(
      'gh/circleci/project',
    );
    vi.mocked(projectDetection.getBranchFromURL).mockReturnValue('main');
    vi.mocked(projectDetection.identifyProjectSlug).mockResolvedValue(
      'gh/circleci/project',
    );
    vi.mocked(
      getLatestPipelineWorkflowsModule.getLatestPipelineWorkflows,
    ).mockResolvedValue(mockWorkflows);
    vi.mocked(
      formatLatestPipelineStatusModule.formatLatestPipelineStatus,
    ).mockReturnValue(mockFormattedResponse);
  });

  it('should get latest pipeline status using projectURL', async () => {
    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/github/circleci/project',
      },
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    expect(projectDetection.getProjectSlugFromURL).toHaveBeenCalledWith(
      args.params.projectURL,
    );
    expect(projectDetection.getBranchFromURL).toHaveBeenCalledWith(
      args.params.projectURL,
    );
    expect(
      getLatestPipelineWorkflowsModule.getLatestPipelineWorkflows,
    ).toHaveBeenCalledWith({
      projectSlug: 'gh/circleci/project',
      branch: 'main',
    });
    expect(
      formatLatestPipelineStatusModule.formatLatestPipelineStatus,
    ).toHaveBeenCalledWith(mockWorkflows);
    expect(response).toEqual(mockFormattedResponse);
  });

  it('should return a valid MCP error response when projectSlug is provided without branch', async () => {
    const args = {
      params: {
        projectSlug: 'gh/circleci/project',
      },
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Branch not provided');
  });

  it('should get latest pipeline status using workspace and git info', async () => {
    const args = {
      params: {
        workspaceRoot: '/path/to/workspace',
        gitRemoteURL: 'https://github.com/circleci/project.git',
        branch: 'feature/branch',
      },
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    expect(projectDetection.identifyProjectSlug).toHaveBeenCalledWith({
      gitRemoteURL: args.params.gitRemoteURL,
    });
    expect(
      getLatestPipelineWorkflowsModule.getLatestPipelineWorkflows,
    ).toHaveBeenCalledWith({
      projectSlug: 'gh/circleci/project',
      branch: 'feature/branch',
    });
    expect(
      formatLatestPipelineStatusModule.formatLatestPipelineStatus,
    ).toHaveBeenCalledWith(mockWorkflows);
    expect(response).toEqual(mockFormattedResponse);
  });

  it('should get latest pipeline status using projectSlug and branch', async () => {
    const args = {
      params: {
        projectSlug: 'gh/circleci/project',
        branch: 'feature/branch',
      },
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    // Verify that project detection functions were not called
    expect(projectDetection.getProjectSlugFromURL).not.toHaveBeenCalled();
    expect(projectDetection.identifyProjectSlug).not.toHaveBeenCalled();

    expect(
      getLatestPipelineWorkflowsModule.getLatestPipelineWorkflows,
    ).toHaveBeenCalledWith({
      projectSlug: 'gh/circleci/project',
      branch: 'feature/branch',
    });
    expect(
      formatLatestPipelineStatusModule.formatLatestPipelineStatus,
    ).toHaveBeenCalledWith(mockWorkflows);
    expect(response).toEqual(mockFormattedResponse);
  });

  it('should return error when no valid inputs are provided', async () => {
    const args = {
      params: {},
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain('Missing required inputs');
  });

  it('should return error when project slug cannot be identified', async () => {
    // Return null to simulate project not found
    vi.mocked(projectDetection.identifyProjectSlug).mockResolvedValue(
      null as unknown as string,
    );

    const args = {
      params: {
        workspaceRoot: '/path/to/workspace',
        gitRemoteURL: 'https://github.com/circleci/project.git',
        branch: 'feature/branch',
      },
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain('Project not found');
  });

  it('should get pipeline status when branch is provided from URL but not in params', async () => {
    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/github/circleci/project?branch=develop',
      },
    };

    const controller = new AbortController();
    const response = await getLatestPipelineStatus(args as any, {
      signal: controller.signal,
    });

    expect(
      getLatestPipelineWorkflowsModule.getLatestPipelineWorkflows,
    ).toHaveBeenCalledWith({
      projectSlug: 'gh/circleci/project',
      branch: 'main', // This is what our mock returns
    });
    expect(response).toEqual(mockFormattedResponse);
  });

  it('should handle errors from getLatestPipelineWorkflows', async () => {
    vi.mocked(
      getLatestPipelineWorkflowsModule.getLatestPipelineWorkflows,
    ).mockRejectedValue(new Error('Failed to fetch workflows'));

    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/github/circleci/project',
      },
    };

    // We expect the handler to throw the error so we can catch it
    const controller = new AbortController();
    await expect(
      getLatestPipelineStatus(args as any, { signal: controller.signal }),
    ).rejects.toThrow('Failed to fetch workflows');
  });
});
