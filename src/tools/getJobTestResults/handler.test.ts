import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJobTestResults } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import * as getJobTestsModule from '../../lib/pipeline-job-tests/getJobTests.js';
import * as formatJobTestsModule from '../../lib/pipeline-job-tests/formatJobTests.js';

// Mock dependencies
vi.mock('../../lib/project-detection/index.js');
vi.mock('../../lib/pipeline-job-tests/getJobTests.js');
vi.mock('../../lib/pipeline-job-tests/formatJobTests.js');

describe('getJobTestResults handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return a valid MCP error response when no inputs are provided', async () => {
    const args = {
      params: {},
    };

    const controller = new AbortController();
    const response = await getJobTestResults(args, {
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
    const response = await getJobTestResults(args, {
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
    const response = await getJobTestResults(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Branch not provided');
  });

  it('should return a valid MCP success response with test results for a specific job', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(123);

    const mockTests = [
      {
        message: 'No failures',
        run_time: 0.5,
        file: 'src/test.js',
        result: 'success',
        name: 'should pass the test',
        classname: 'TestClass',
      },
    ];

    vi.spyOn(getJobTestsModule, 'getJobTests').mockResolvedValue(mockTests);

    vi.spyOn(formatJobTestsModule, 'formatJobTests').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Test results output',
        },
      ],
    });

    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc-def/jobs/123',
      },
    } as any;

    const controller = new AbortController();
    const response = await getJobTestResults(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    expect(getJobTestsModule.getJobTests).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: undefined,
      jobNumber: 123,
    });
  });

  it('should return a valid MCP success response with test results for projectSlug and branch', async () => {
    const mockTests = [
      {
        message: 'No failures',
        run_time: 0.5,
        file: 'src/test.js',
        result: 'success',
        name: 'should pass the test',
        classname: 'TestClass',
      },
    ];

    vi.spyOn(getJobTestsModule, 'getJobTests').mockResolvedValue(mockTests);

    vi.spyOn(formatJobTestsModule, 'formatJobTests').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Test results output',
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
    const response = await getJobTestResults(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    expect(getJobTestsModule.getJobTests).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'feature/new-feature',
      jobNumber: undefined,
    });
  });

  it('should return a valid MCP success response with test results for a branch', async () => {
    vi.spyOn(projectDetection, 'identifyProjectSlug').mockResolvedValue(
      'gh/org/repo',
    );

    const mockTests = [
      {
        message: 'No failures',
        run_time: 0.5,
        file: 'src/test.js',
        result: 'success',
        name: 'should pass the test',
        classname: 'TestClass',
      },
    ];

    vi.spyOn(getJobTestsModule, 'getJobTests').mockResolvedValue(mockTests);

    vi.spyOn(formatJobTestsModule, 'formatJobTests').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Test results output',
        },
      ],
    });

    const args = {
      params: {
        workspaceRoot: '/workspace',
        gitRemoteURL: 'https://github.com/org/repo.git',
        branch: 'main',
      },
    } as any;

    const controller = new AbortController();
    const response = await getJobTestResults(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    expect(getJobTestsModule.getJobTests).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      jobNumber: undefined,
    });
  });

  it('should filter test results by success when filterByTestsResult is success', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(123);

    const mockTests = [
      {
        message: 'No failures',
        run_time: 0.5,
        file: 'src/test1.js',
        result: 'success',
        name: 'should pass test 1',
        classname: 'TestClass1',
      },
      {
        message: 'Test failed',
        run_time: 0.3,
        file: 'src/test2.js',
        result: 'failure',
        name: 'should fail test 2',
        classname: 'TestClass2',
      },
      {
        message: 'No failures',
        run_time: 0.4,
        file: 'src/test3.js',
        result: 'success',
        name: 'should pass test 3',
        classname: 'TestClass3',
      },
    ];

    vi.spyOn(getJobTestsModule, 'getJobTests').mockResolvedValue(mockTests);

    vi.spyOn(formatJobTestsModule, 'formatJobTests').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Test results output',
        },
      ],
    });

    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc-def/jobs/123',
        filterByTestsResult: 'success',
      },
    } as any;

    const controller = new AbortController();
    const response = await getJobTestResults(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    expect(getJobTestsModule.getJobTests).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: undefined,
      jobNumber: 123,
      filterByTestsResult: 'success',
    });
  });

  it('should filter test results by failure when filterByTestsResult is failure', async () => {
    vi.spyOn(projectDetection, 'getProjectSlugFromURL').mockReturnValue(
      'gh/org/repo',
    );
    vi.spyOn(projectDetection, 'getJobNumberFromURL').mockReturnValue(123);

    const mockTests = [
      {
        message: 'No failures',
        run_time: 0.5,
        file: 'src/test1.js',
        result: 'success',
        name: 'should pass test 1',
        classname: 'TestClass1',
      },
      {
        message: 'Test failed',
        run_time: 0.3,
        file: 'src/test2.js',
        result: 'failure',
        name: 'should fail test 2',
        classname: 'TestClass2',
      },
      {
        message: 'Test failed',
        run_time: 0.4,
        file: 'src/test3.js',
        result: 'failure',
        name: 'should fail test 3',
        classname: 'TestClass3',
      },
    ];

    vi.spyOn(getJobTestsModule, 'getJobTests').mockResolvedValue(mockTests);

    vi.spyOn(formatJobTestsModule, 'formatJobTests').mockReturnValue({
      content: [
        {
          type: 'text',
          text: 'Test results output',
        },
      ],
    });

    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc-def/jobs/123',
        filterByTestsResult: 'failure',
      },
    } as any;

    const controller = new AbortController();
    const response = await getJobTestResults(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');

    expect(getJobTestsModule.getJobTests).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: undefined,
      jobNumber: 123,
      filterByTestsResult: 'failure',
    });
  });
});
