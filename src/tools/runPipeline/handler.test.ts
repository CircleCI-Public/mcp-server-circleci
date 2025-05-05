import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';

describe('runPipeline handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

  it('should return a valid MCP success response', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );

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
  });
});
