import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLatestPipelineWorkflows } from './getLatestPipelineWorkflows.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('getLatestPipelineWorkflows', () => {
  const mockWorkflows = [
    {
      id: 'wf-1',
      name: 'build',
      status: 'success',
      created_at: '2026-04-21T00:00:00Z',
      pipeline_number: 42,
      project_slug: 'gh/org/repo',
      pipeline_id: 'pipeline-abc',
    },
  ];

  const mockCircleCIClient = {
    pipelines: {
      getPipelines: vi.fn(),
    },
    workflows: {
      getPipelineWorkflows: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(clientModule, 'getCircleCIClient').mockReturnValue(
      mockCircleCIClient as any,
    );
    mockCircleCIClient.workflows.getPipelineWorkflows.mockResolvedValue(
      mockWorkflows,
    );
  });

  it('uses pipelineId directly and skips branch search when pipelineId is provided', async () => {
    const result = await getLatestPipelineWorkflows({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      pipelineId: 'pipeline-abc',
    });

    expect(mockCircleCIClient.pipelines.getPipelines).not.toHaveBeenCalled();
    expect(
      mockCircleCIClient.workflows.getPipelineWorkflows,
    ).toHaveBeenCalledWith({ pipelineId: 'pipeline-abc' });
    expect(result).toEqual(mockWorkflows);
  });

  it('falls back to branch search when pipelineId is not provided', async () => {
    mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
      { id: 'pipeline-xyz', project_slug: 'gh/org/repo', number: 10 },
    ]);

    const result = await getLatestPipelineWorkflows({
      projectSlug: 'gh/org/repo',
      branch: 'main',
    });

    expect(mockCircleCIClient.pipelines.getPipelines).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      branch: 'main',
    });
    expect(
      mockCircleCIClient.workflows.getPipelineWorkflows,
    ).toHaveBeenCalledWith({ pipelineId: 'pipeline-xyz' });
    expect(result).toEqual(mockWorkflows);
  });

  it('throws when no pipelines found and pipelineId is absent', async () => {
    mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([]);

    await expect(
      getLatestPipelineWorkflows({ projectSlug: 'gh/org/repo', branch: 'main' }),
    ).rejects.toThrow('Latest pipeline not found');

    expect(
      mockCircleCIClient.workflows.getPipelineWorkflows,
    ).not.toHaveBeenCalled();
  });

  it('ignores a second pipeline on the same branch when pipelineId pins the first', async () => {
    // Simulate race: a second pipeline "def-456" was pushed to same branch.
    // Agent captured "abc-123" at trigger time and passes it via pipelineId.
    mockCircleCIClient.pipelines.getPipelines.mockResolvedValue([
      { id: 'def-456', project_slug: 'gh/org/repo', number: 11 },
      { id: 'abc-123', project_slug: 'gh/org/repo', number: 10 },
    ]);

    await getLatestPipelineWorkflows({
      projectSlug: 'gh/org/repo',
      branch: 'main',
      pipelineId: 'abc-123',
    });

    // Must use the pinned ID, not def-456 (the most recent)
    expect(
      mockCircleCIClient.workflows.getPipelineWorkflows,
    ).toHaveBeenCalledWith({ pipelineId: 'abc-123' });
    expect(mockCircleCIClient.pipelines.getPipelines).not.toHaveBeenCalled();
  });
});
