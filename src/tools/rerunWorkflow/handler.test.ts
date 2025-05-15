import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rerunWorkflow } from './handler.js';
import * as client from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('rerunWorkflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return the new workflowId and url to the user when the return is successful', async () => {
    const mockCircleCIClient = {
      rerunWorkflow: {
        rerunWorkflow: vi.fn().mockResolvedValue({
          workflow_id: '11111111-1111-1111-1111-111111111111',
        }),
      },
      workflow: {
        getWorkflow: vi.fn().mockResolvedValue({
          id: '11111111-1111-1111-1111-111111111111',
          project_slug: 'test-project',
          pipeline_number: 1,
        }),
      },
    };

    vi.spyOn(client, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );

    const controller = new AbortController();
    const result = await rerunWorkflow(
      {
        params: {
          workflowId: '00000000-0000-0000-0000-000000000000',
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'New workflowId is 11111111-1111-1111-1111-111111111111 and [View Workflow in CircleCI](https://app.circleci.com/pipelines/test-project/1/workflows/11111111-1111-1111-1111-111111111111)',
        },
      ],
    });
  });

  it('should return an error message when the rerun workflow is not successful', async () => {
    const mockCircleCIClient = {
      rerunWorkflow: {
        rerunWorkflow: vi.fn().mockResolvedValue({
          workflow_id: '',
        }),
      },
      workflow: {
        getWorkflow: vi.fn().mockResolvedValue({
          id: '11111111-1111-1111-1111-111111111111',
          project_slug: 'test-project',
          pipeline_number: 1,
        }),
      },
    };

    vi.spyOn(client, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );

    const controller = new AbortController();
    const result = await rerunWorkflow(
      {
        params: {
          workflowId: '00000000-0000-0000-0000-000000000000',
        },
      },
      {
        signal: controller.signal,
      },
    );

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Failed to rerun workflow.',
        },
      ],
    });
  });
});
