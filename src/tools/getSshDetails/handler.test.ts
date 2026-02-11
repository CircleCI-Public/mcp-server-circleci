import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSshDetails } from './handler.js';
import * as client from '../../clients/client.js';

vi.mock('../../clients/client.js');

const workflowId = 'd007e87d-a6ee-46a7-a140-98eae0169528';
const jobId1 = 'c65b68ef-e73b-4bf2-be9a-7a322a9df150';
const jobId2 = '5e957edd-5e8c-4985-9178-5d0d69561822';

function setupMockClient(
  workflowJobs = [],
  jobDetails = null,
  stepOutput = null,
  workflow = { project_slug: 'gh/circleci/circleci-cli' },
) {
  const mockCircleCIClient = {
    workflows: {
      getWorkflow: vi.fn().mockResolvedValue(workflow),
    },
    jobs: {
      getWorkflowJobs: vi.fn().mockResolvedValue(workflowJobs),
    },
    jobsV1: {
      getJobDetails: vi.fn().mockResolvedValue(jobDetails),
    },
  };

  const mockCircleCIPrivateClient = {
    jobs: {
      getStepOutput: vi.fn().mockResolvedValue(stepOutput),
    },
  };

  vi.spyOn(client, 'getCircleCIClient').mockReturnValue(
    mockCircleCIClient as any,
  );
  vi.spyOn(client, 'getCircleCIPrivateClient').mockReturnValue(
    mockCircleCIPrivateClient as any,
  );

  return { mockCircleCIClient, mockCircleCIPrivateClient };
}

describe('getSshDetails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return SSH details for a specific job number', async () => {
    const mockJobs = [
      {
        id: jobId1,
        job_number: 34069,
      },
    ];

    const mockJobDetails = {
      build_num: 34069,
      steps: [
        {
          name: 'Enable SSH',
          actions: [{ index: 0, step: 100, failed: false }],
        },
      ],
      workflows: { job_name: 'build' },
    };

    const mockStepOutput = {
      output: 'You can now SSH into this box:\n    $ ssh -p 54782 52.90.100.100',
      error: '',
    };

    const { mockCircleCIClient, mockCircleCIPrivateClient } = setupMockClient(
      mockJobs,
      mockJobDetails,
      mockStepOutput,
    );

    const controller = new AbortController();
    const response = await getSshDetails(
      {
        params: {
          workflowId,
          jobNumber: 34069,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(mockCircleCIClient.jobs.getWorkflowJobs).toHaveBeenCalledWith({
      workflowId,
    });
    expect(mockCircleCIClient.jobsV1.getJobDetails).toHaveBeenCalled();
    expect(mockCircleCIPrivateClient.jobs.getStepOutput).toHaveBeenCalled();
    expect(response.content[0].text).toContain('ssh -p 54782 52.90.100.100');
    expect(response.content[0].text).toContain('#34069');
  });

  it('should automatically find the last SSH-enabled job when jobNumber not provided', async () => {
    const mockJobs = [
      {
        id: jobId1,
        job_number: 34069,
      },
      {
        id: jobId2,
        job_number: 34070,
      },
    ];

    const mockJobDetails = {
      build_num: 34070,
      steps: [
        {
          name: 'Enable SSH',
          actions: [{ index: 0, step: 100, failed: false }],
        },
      ],
      workflows: { job_name: 'test' },
    };

    const mockStepOutput = {
      output: '$ ssh -p 54783 52.90.100.101',
      error: '',
    };

    const { mockCircleCIClient } = setupMockClient(
      mockJobs,
      mockJobDetails,
      mockStepOutput,
    );

    const controller = new AbortController();
    const response = await getSshDetails(
      {
        params: {
          workflowId,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(mockCircleCIClient.jobsV1.getJobDetails).toHaveBeenCalled();
    expect(response.content[0].text).toContain('ssh -p 54783 52.90.100.101');
    expect(response.content[0].text).toContain('test');
  });

  it('should return error when specified job number not found', async () => {
    const mockJobs = [
      {
        id: jobId1,
        job_number: 34069,
      },
    ];

    setupMockClient(mockJobs);

    const controller = new AbortController();
    const response = await getSshDetails(
      {
        params: {
          workflowId,
          jobNumber: 99999,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('Job number 99999 not found');
  });

  it('should return helpful message when no SSH-enabled jobs found', async () => {
    const mockJobs = [
      {
        id: jobId1,
        job_number: 34069,
      },
    ];

    const mockJobDetailsNoSsh = {
      build_num: 34069,
      steps: [
        {
          name: 'Checkout',
          actions: [],
        },
      ],
    };

    setupMockClient(mockJobs, mockJobDetailsNoSsh);

    const controller = new AbortController();
    const response = await getSshDetails(
      {
        params: {
          workflowId,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(response.content[0].text).toContain('No SSH-enabled jobs found');
    expect(response.content[0].text).toContain('enableSsh: true');
  });

  it('should return error when no jobs in workflow', async () => {
    setupMockClient([]);

    const controller = new AbortController();
    const response = await getSshDetails(
      {
        params: {
          workflowId,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('No jobs found');
  });

  it('should handle job not ready yet (SSH step not found)', async () => {
    const mockJobs = [
      {
        id: jobId1,
        job_number: 34069,
      },
    ];

    const mockJobDetailsNoSshStep = {
      build_num: 34069,
      steps: [],
    };

    setupMockClient(mockJobs, mockJobDetailsNoSshStep);

    const controller = new AbortController();
    const response = await getSshDetails(
      {
        params: {
          workflowId,
          jobNumber: 34069,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(response.content[0].text).toContain('SSH step not found');
    expect(response.content[0].text).toContain('wait 30-60 seconds');
  });

  it('should extract workflow ID from URL', async () => {
    const mockJobs = [
      {
        id: jobId1,
        job_number: 34069,
      },
    ];

    const mockJobDetails = {
      build_num: 34069,
      steps: [
        {
          name: 'Enable SSH',
          actions: [{ index: 0, step: 100, failed: false }],
        },
      ],
      workflows: { job_name: 'build' },
    };

    const mockStepOutput = {
      output: '$ ssh -p 54782 52.90.100.100',
      error: '',
    };

    const { mockCircleCIClient } = setupMockClient(
      mockJobs,
      mockJobDetails,
      mockStepOutput,
    );

    const controller = new AbortController();
    await getSshDetails(
      {
        params: {
          workflowURL: `https://app.circleci.com/pipelines/workflows/${workflowId}`,
          jobNumber: 34069,
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(mockCircleCIClient.jobs.getWorkflowJobs).toHaveBeenCalledWith({
      workflowId,
    });
  });
});
