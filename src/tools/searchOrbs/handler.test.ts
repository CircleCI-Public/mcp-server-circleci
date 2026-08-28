import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchOrbs } from './handler.js';
import * as client from '../../clients/client.js';

vi.mock('../../clients/client.js');

const callHandler = async (params: { query?: string }) => {
  const controller = new AbortController();
  return searchOrbs(
    { params } as Parameters<typeof searchOrbs>[0],
    { signal: controller.signal } as Parameters<typeof searchOrbs>[1],
  );
};

describe('searchOrbs handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('formats matching orbs sorted by popularity', async () => {
    vi.spyOn(client, 'getCircleCIClient').mockReturnValue({
      orbs: {
        searchOrbs: vi.fn().mockResolvedValue([
          { name: 'circleci/slack', version: '6.1.3', popularity: 7533848 },
          { name: 'circleci/slack-orb-tools', version: '1.0.0', popularity: 12 },
        ]),
      },
    } as unknown as ReturnType<typeof client.getCircleCIClient>);

    const response = await callHandler({ query: 'slack' });
    const text = response.content[0].text;
    expect(text).toContain('Found 2 matching certified orbs for "slack"');
    expect(text).toContain('`circleci/slack@6.1.3`');
    expect(text).toContain('7,533,848 builds');
    expect(text).toContain('`circleci/slack-orb-tools@1.0.0`');
  });

  it('returns helpful no-results message when nothing matches', async () => {
    vi.spyOn(client, 'getCircleCIClient').mockReturnValue({
      orbs: {
        searchOrbs: vi.fn().mockResolvedValue([]),
      },
    } as unknown as ReturnType<typeof client.getCircleCIClient>);

    const response = await callHandler({ query: 'asdfghjkl' });
    expect(response.content[0].text).toContain('No certified orbs match');
    expect(response.content[0].text).toContain('get_orb_details');
  });

  it('returns mcp error when query is missing', async () => {
    const response = await callHandler({});
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('query');
  });

  it('returns mcp error when OrbsAPI throws', async () => {
    vi.spyOn(client, 'getCircleCIClient').mockReturnValue({
      orbs: {
        searchOrbs: vi.fn().mockRejectedValue(new Error('GraphQL error: boom')),
      },
    } as unknown as ReturnType<typeof client.getCircleCIClient>);

    const response = await callHandler({ query: 'slack' });
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('boom');
  });
});
