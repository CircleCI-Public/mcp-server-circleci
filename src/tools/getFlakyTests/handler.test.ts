import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFlakyTestLogs } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as getFlakyTestsModule from '../../lib/flaky-tests/getFlakyTests.js';
import * as formatFlakyTestsModule from '../../lib/flaky-tests/getFlakyTests.js';

// Mock dependencies
vi.mock('../../lib/project-detection/index.js');
vi.mock('../../lib/flaky-tests/getFlakyTests.js');

describe('getFlakyTestLogs handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a valid MCP error response when no inputs are provided', async () => {
    const args = {
      params: {},
    } as any;

    const controller = new AbortController();
    const response = await getFlakyTestLogs(args, {
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
      },
    } as any;

    const controller = new AbortController();
    const response = await getFlakyTestLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should return a valid MCP success response with flaky tests', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );

    vi.spyOn(getFlakyTestsModule, 'default').mockResolvedValue([
      {
        name: 'flakyTest',
        message: 'Test failure message',
        run_time: '1.5',
        result: 'failure',
        classname: 'TestClass',
        file: 'path/to/file.js',
      },
    ]);

    vi.spyOn(formatFlakyTestsModule, 'formatFlakyTests').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Flaky test output',
        },
      ],
    });

    const args = {
      params: {
        projectURL: 'https://app.circleci.com/pipelines/gh/org/repo',
      },
    } as any;

    const controller = new AbortController();
    const response = await getFlakyTestLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });
});
