import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBuildFailureLogs } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as getPipelineJobLogsModule from '../../lib/pipeline-job-logs/getPipelineJobLogs.js';
import * as formatJobLogs from '../../lib/pipeline-job-logs/getJobLogs.js';

// Mock dependencies
vi.mock('../../lib/project-detection/index.js');
vi.mock('../../lib/pipeline-job-logs/getPipelineJobLogs.js');
vi.mock('../../lib/pipeline-job-logs/getJobLogs.js');

describe('getBuildFailureLogs handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a valid MCP error response when no inputs are provided', async () => {
    const args = {
      params: {},
    } as any;

    const controller = new AbortController();
    const response = await getBuildFailureLogs(args, {
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
    const response = await getBuildFailureLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should return a valid MCP error response when projectSlug is provided without branch', async () => {
    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await getBuildFailureLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Branch not provided');
  });

  it('should return a valid MCP success response with logs', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );

    vi.spyOn(getPipelineJobLogsModule, 'default').mockResolvedValue([
      {
        jobName: 'test',
        steps: [
          {
            stepName: 'Run tests',
            logs: { output: 'Test failed', error: '' },
          },
        ],
      },
    ]);

    vi.spyOn(formatJobLogs, 'formatJobLogs').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Job logs output',
        },
      ],
    });

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await getBuildFailureLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should handle projectSlug and branch inputs correctly', async () => {
    const mockLogs = [
      {
        jobName: 'build',
        steps: [
          {
            stepName: 'Build app',
            logs: { output: 'Build failed', error: 'Error: build failed' },
          },
        ],
      },
    ];

    vi.spyOn(getPipelineJobLogsModule, 'default').mockResolvedValue(mockLogs);

    vi.spyOn(formatJobLogs, 'formatJobLogs').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Formatted job logs',
        },
      ],
    });

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        branch: 'feature/new-feature',
      },
    } as any;

    const controller = new AbortController();
    const response = await getBuildFailureLogs(args, {
      signal: controller.signal,
    });

    expect(getPipelineJobLogsModule.default).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'feature/new-feature',
      pipelineNumber: undefined,
      jobNumber: undefined,
    });

    expect(formatJobLogs.formatJobLogs).toHaveBeenCalledWith(mockLogs);
    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });
});
