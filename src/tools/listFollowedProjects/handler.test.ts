import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listFollowedProjects } from './handler.js';
import * as clientModule from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('listFollowedProjects handler', () => {
  const mockCircleCIPrivateClient = {
    me: {
      getFollowedProjects: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(clientModule, 'getCircleCIPrivateClient').mockReturnValue(
      mockCircleCIPrivateClient as any,
    );
  });

  it('should return an error when no projects are found', async () => {
    mockCircleCIPrivateClient.me.getFollowedProjects.mockResolvedValue({
      projects: [],
      reachedMaxPagesOrTimeout: false,
    });

    const args = { params: {} } as any;
    const controller = new AbortController();
    const response = await listFollowedProjects(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('isError', true);
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('No projects found');
  });

  it('should return a list of followed projects', async () => {
    const mockProjects = [
      { name: 'Project 1', slug: 'gh/org/project1' },
      { name: 'Project 2', slug: 'gh/org/project2' },
    ];

    mockCircleCIPrivateClient.me.getFollowedProjects.mockResolvedValue({
      projects: mockProjects,
      reachedMaxPagesOrTimeout: false,
    });

    const args = { params: {} } as any;
    const controller = new AbortController();
    const response = await listFollowedProjects(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain('Projects followed:');
    expect(response.content[0].text).toContain('Project 1');
    expect(response.content[0].text).toContain('gh/org/project1');
    expect(response.content[0].text).toContain('Project 2');
    expect(response.content[0].text).toContain('gh/org/project2');
  });

  it('should add a warning when not all projects were included', async () => {
    const mockProjects = [{ name: 'Project 1', slug: 'gh/org/project1' }];

    mockCircleCIPrivateClient.me.getFollowedProjects.mockResolvedValue({
      projects: mockProjects,
      reachedMaxPagesOrTimeout: true,
    });

    const args = { params: {} } as any;
    const controller = new AbortController();
    const response = await listFollowedProjects(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(typeof response.content[0].text).toBe('string');
    expect(response.content[0].text).toContain(
      'WARNING: Not all projects were included',
    );
    expect(response.content[0].text).toContain('Project 1');
    expect(response.content[0].text).toContain('gh/org/project1');
  });
});
