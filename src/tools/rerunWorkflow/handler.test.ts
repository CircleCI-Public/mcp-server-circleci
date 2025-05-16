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
      workflows: {
        rerunWorkflow: vi.fn().mockResolvedValue({
          workflow_id: '11111111-1111-1111-1111-111111111111',
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
          text: 'New workflowId is 11111111-1111-1111-1111-111111111111 and [View Workflow in CircleCI](https://app.circleci.com/pipelines/workflows/11111111-1111-1111-1111-111111111111)',
        },
      ],
    });
  });
});
