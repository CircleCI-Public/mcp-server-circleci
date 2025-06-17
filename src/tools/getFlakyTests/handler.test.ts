import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFlakyTestLogs, useFileOutputDirectory } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as getFlakyTestsModule from '../../lib/flaky-tests/getFlakyTests.js';
import * as formatFlakyTestsModule from '../../lib/flaky-tests/getFlakyTests.js';

// Mock dependencies
vi.mock('../../lib/project-detection/index.js');
vi.mock('../../lib/flaky-tests/getFlakyTests.js');

// Define mock functions using vi.hoisted() to make them available everywhere
const { mockWriteFileSync, mockMkdirSync, mockJoin } = vi.hoisted(() => ({
  mockWriteFileSync: vi.fn(),
  mockMkdirSync: vi.fn(),
  mockJoin: vi.fn(),
}));

vi.mock('fs', () => ({
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
}));

vi.mock('path', () => ({
  join: mockJoin,
}));

describe('getFlakyTestLogs handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.USE_FILE_OUTPUT;
  });

  it('should return a valid MCP error response when no inputs are provided', async () => {
    const args = {
      params: {},
    };

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
    };

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

  it('should use projectSlug directly when provided', async () => {
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
        projectSlug: 'gh/org/repo',
      },
    };

    const controller = new AbortController();
    await getFlakyTestLogs(args, {
      signal: controller.signal,
    });

    expect(getFlakyTestsModule.default).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
    });
    // Verify that no project detection methods were called
    expect(projectDetection.getProjectSlugFromURL).not.toHaveBeenCalled();
    expect(projectDetection.identifyProjectSlug).not.toHaveBeenCalled();
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
    };

    const controller = new AbortController();
    const response = await getFlakyTestLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
  });

  it('should write flaky tests to files when USE_FILE_OUTPUT is true', async () => {
    process.env.USE_FILE_OUTPUT = 'true';

    // Mock path.join to return predictable file paths for cross-platform test consistency
    // This ensures the same path format regardless of OS (Windows uses \, Unix uses /)
    mockJoin.mockImplementation((dir, filename) => `${dir}/${filename}`);

    vi.spyOn(getFlakyTestsModule, 'default').mockResolvedValue([
      {
        name: 'flakyTest',
        message: 'Test failure message',
        run_time: '1.5',
        result: 'failure',
        classname: 'TestClass',
        file: 'path/to/file.js',
      },
      {
        name: 'anotherFlakyTest',
        message: 'Another test failure',
        run_time: '2.1',
        result: 'failure',
        classname: 'AnotherClass',
        file: 'path/to/another.js',
      },
    ]);

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    };

    const controller = new AbortController();
    const response = await getFlakyTestLogs(args, {
      signal: controller.signal,
    });

    expect(mockMkdirSync).toHaveBeenCalledWith(useFileOutputDirectory, {
      recursive: true,
    });
    expect(mockWriteFileSync).toHaveBeenCalledTimes(3);

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0].text).toContain(
      'Found 2 flaky tests that need stabilization',
    );
    expect(response.content[0].text).toContain(useFileOutputDirectory);
  });

  it('should handle no flaky tests found in file output mode', async () => {
    process.env.USE_FILE_OUTPUT = 'true';

    vi.spyOn(getFlakyTestsModule, 'default').mockResolvedValue([]);

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    };

    const controller = new AbortController();
    const response = await getFlakyTestLogs(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response.content[0].text).toBe(
      'No flaky tests found - no files created',
    );
  });
});
