import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assertSafeRemoteExposure,
  evaluateRemoteExposure,
  isLoopbackBindHost,
  isUnauthenticatedNetworkAccessAcknowledged,
} from './networkExposure.js';

describe('isLoopbackBindHost', () => {
  it.each(['127.0.0.1', '127.1.2.3', 'localhost', '::1', '[::1]', '::ffff:127.0.0.1'])(
    'treats %s as loopback',
    (host) => {
      expect(isLoopbackBindHost(host)).toBe(true);
    },
  );

  it.each(['0.0.0.0', '::', '[::]', '10.0.0.5', '192.168.1.20', 'my-mcp.example.com'])(
    'treats %s as network-exposed',
    (host) => {
      expect(isLoopbackBindHost(host)).toBe(false);
    },
  );

  it('treats unset or blank as network-exposed (all interfaces)', () => {
    expect(isLoopbackBindHost(undefined)).toBe(false);
    expect(isLoopbackBindHost('   ')).toBe(false);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(isLoopbackBindHost(' LocalHost ')).toBe(true);
  });

  it('does not treat lookalike addresses as loopback', () => {
    // 127.0.0.1.evil.com and 0127.0.0.1 must not pass.
    expect(isLoopbackBindHost('127.0.0.1.evil.com')).toBe(false);
    expect(isLoopbackBindHost('1270.0.0.1')).toBe(false);
    expect(isLoopbackBindHost('localhost.evil.com')).toBe(false);
  });
});

describe('evaluateRemoteExposure', () => {
  it('allows a network bind when per-request tokens are required', () => {
    const verdict = evaluateRemoteExposure({
      bindHost: '0.0.0.0',
      tokenRequired: true,
      acknowledged: false,
    });
    expect(verdict).toEqual({ safe: true });
  });

  it('allows auth-disabled mode on loopback but warns', () => {
    const verdict = evaluateRemoteExposure({
      bindHost: '127.0.0.1',
      tokenRequired: false,
      acknowledged: false,
    });
    expect(verdict.safe).toBe(true);
    expect(verdict.safe && verdict.warning).toMatch(/loopback/);
  });

  it('refuses auth-disabled mode on a wildcard bind', () => {
    const verdict = evaluateRemoteExposure({
      bindHost: '0.0.0.0',
      tokenRequired: false,
      acknowledged: false,
    });
    expect(verdict.safe).toBe(false);
    expect(!verdict.safe && verdict.reason).toMatch(/Refusing to start/);
  });

  it('refuses auth-disabled mode on a specific routable address', () => {
    const verdict = evaluateRemoteExposure({
      bindHost: '10.0.0.5',
      tokenRequired: false,
      acknowledged: false,
    });
    expect(verdict.safe).toBe(false);
  });

  it('names each remediation option in the refusal', () => {
    const verdict = evaluateRemoteExposure({
      bindHost: '0.0.0.0',
      tokenRequired: false,
      acknowledged: false,
    });
    const reason = !verdict.safe ? verdict.reason : '';
    expect(reason).toMatch(/REQUIRE_REQUEST_TOKEN=true/);
    expect(reason).toMatch(/MCP_BIND_HOST=127\.0\.0\.1/);
    expect(reason).toMatch(/MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS=true/);
  });

  it('allows the unsafe combination once explicitly acknowledged, with a warning', () => {
    const verdict = evaluateRemoteExposure({
      bindHost: '0.0.0.0',
      tokenRequired: false,
      acknowledged: true,
    });
    expect(verdict.safe).toBe(true);
    expect(verdict.safe && verdict.warning).toMatch(/no\s+credential required/);
  });

  it('does not require acknowledgement when tokens are required', () => {
    // Acknowledgement is irrelevant in the authenticated case — no warning either.
    expect(
      evaluateRemoteExposure({
        bindHost: '0.0.0.0',
        tokenRequired: true,
        acknowledged: true,
      }),
    ).toEqual({ safe: true });
  });
});

describe('isUnauthenticatedNetworkAccessAcknowledged', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('is false when unset', () => {
    expect(isUnauthenticatedNetworkAccessAcknowledged()).toBe(false);
  });

  it('is true only for the exact string "true"', () => {
    process.env.MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS = 'true';
    expect(isUnauthenticatedNetworkAccessAcknowledged()).toBe(true);
  });

  it.each(['1', 'yes', 'TRUE', ''])('is false for %o', (value) => {
    process.env.MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS = value;
    expect(isUnauthenticatedNetworkAccessAcknowledged()).toBe(false);
  });
});

describe('assertSafeRemoteExposure', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('throws on an unauthenticated network bind', () => {
    expect(() => assertSafeRemoteExposure('0.0.0.0', false)).toThrow(
      /Refusing to start/,
    );
  });

  it('does not throw when tokens are required', () => {
    expect(() => assertSafeRemoteExposure('0.0.0.0', true)).not.toThrow();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('warns instead of throwing on loopback with auth disabled', () => {
    expect(() => assertSafeRemoteExposure('127.0.0.1', false)).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('WARNING:'),
    );
  });

  it('warns instead of throwing once acknowledged', () => {
    process.env.MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS = 'true';
    expect(() => assertSafeRemoteExposure('0.0.0.0', false)).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('WARNING:'),
    );
  });
});
