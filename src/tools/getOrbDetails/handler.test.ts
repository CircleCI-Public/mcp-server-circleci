import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrbDetails } from './handler.js';
import * as client from '../../clients/client.js';

vi.mock('../../clients/client.js');

const VALID_SOURCE = `version: 2.1
description: Demo
commands:
  notify:
    description: Notify a channel.
    parameters:
      channel:
        type: string
        default: "#general"
      message:
        type: string
jobs: {}
executors:
  default:
    docker:
      - image: cimg/base:stable
`;

const callHandler = async (params: { orbSlug?: string }) => {
  const controller = new AbortController();
  return getOrbDetails(
    { params } as Parameters<typeof getOrbDetails>[0],
    { signal: controller.signal } as Parameters<typeof getOrbDetails>[1],
  );
};

describe('getOrbDetails handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns formatted schema for a valid orb', async () => {
    vi.spyOn(client, 'getCircleCIClient').mockReturnValue({
      orbs: {
        getOrb: vi.fn().mockResolvedValue({
          orbName: 'circleci/demo',
          version: '1.0.0',
          createdAt: '2025-01-01T00:00:00Z',
          source: VALID_SOURCE,
        }),
      },
    } as unknown as ReturnType<typeof client.getCircleCIClient>);

    const response = await callHandler({ orbSlug: 'circleci/demo' });

    expect(response.content[0].type).toBe('text');
    const text = response.content[0].text;
    expect(text).toContain('circleci/demo@1.0.0');
    expect(text).toContain('notify');
    expect(text).toContain('channel');
    expect(text).toContain('message');
    // The pin line is at the end so it survives tail-truncation.
    expect(text.trimEnd().endsWith('`circleci/demo@1.0.0`')).toBe(true);
  });

  it('returns mcp error when orbSlug is missing', async () => {
    const response = await callHandler({});
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('orbSlug');
  });

  it('returns mcp error when OrbsAPI throws (orb not found)', async () => {
    vi.spyOn(client, 'getCircleCIClient').mockReturnValue({
      orbs: {
        getOrb: vi.fn().mockRejectedValue(new Error("Orb 'foo/bar' not found.")),
      },
    } as unknown as ReturnType<typeof client.getCircleCIClient>);

    const response = await callHandler({ orbSlug: 'foo/bar' });
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Orb 'foo/bar' not found");
  });

  it('returns friendly error when orb source YAML is malformed', async () => {
    vi.spyOn(client, 'getCircleCIClient').mockReturnValue({
      orbs: {
        getOrb: vi.fn().mockResolvedValue({
          orbName: 'circleci/demo',
          version: '1.0.0',
          createdAt: '2025-01-01T00:00:00Z',
          source: 'version: 2.1\ncommands:\n  bad: [unclosed',
        }),
      },
    } as unknown as ReturnType<typeof client.getCircleCIClient>);

    const response = await callHandler({ orbSlug: 'circleci/demo' });
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('could not be parsed');
    expect(response.content[0].text).toContain('circleci/demo@1.0.0');
  });
});
