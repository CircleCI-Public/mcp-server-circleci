import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Request } from 'express';

import {
  getAllowedHosts,
  getAllowedOrigins,
  isHostAllowed,
  isOriginAllowed,
  validateRemoteRequest,
} from './originValidation.js';

function createRequest(headers: Record<string, string | undefined>): Request {
  return {
    header(name: string) {
      const normalized = name.toLowerCase();
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === normalized) return value;
      }
      return undefined;
    },
  } as Request;
}

const PORT = 8000;

describe('getAllowedHosts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_ALLOWED_HOSTS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('includes loopback hosts by default', () => {
    const allowed = getAllowedHosts(PORT);
    expect(allowed.has('localhost')).toBe(true);
    expect(allowed.has('127.0.0.1')).toBe(true);
    expect(allowed.has('[::1]')).toBe(true);
    expect(allowed.has('::1')).toBe(true);
  });

  it('includes loopback hosts with port by default', () => {
    const allowed = getAllowedHosts(PORT);
    expect(allowed.has('localhost:8000')).toBe(true);
    expect(allowed.has('127.0.0.1:8000')).toBe(true);
  });

  it('does not include foreign hosts by default', () => {
    const allowed = getAllowedHosts(PORT);
    expect(allowed.has('attacker.com')).toBe(false);
    expect(allowed.has('example.com:8000')).toBe(false);
  });

  it('adds public host from MCP_ALLOWED_HOSTS', () => {
    process.env.MCP_ALLOWED_HOSTS = 'my-mcp.example.com,my-mcp.example.com:443';
    const allowed = getAllowedHosts(PORT);
    expect(allowed.has('my-mcp.example.com')).toBe(true);
    expect(allowed.has('my-mcp.example.com:443')).toBe(true);
  });

  it('MCP_ALLOWED_HOSTS does not include unlisted hosts', () => {
    process.env.MCP_ALLOWED_HOSTS = 'my-mcp.example.com';
    const allowed = getAllowedHosts(PORT);
    expect(allowed.has('other.example.com')).toBe(false);
  });
});

describe('getAllowedOrigins', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_ALLOWED_ORIGINS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('includes loopback origins by default', () => {
    const allowed = getAllowedOrigins(PORT);
    expect(allowed.has('http://localhost')).toBe(true);
    expect(allowed.has('https://localhost')).toBe(true);
    expect(allowed.has('http://127.0.0.1')).toBe(true);
    expect(allowed.has('https://127.0.0.1')).toBe(true);
  });

  it('includes loopback origins with port by default', () => {
    const allowed = getAllowedOrigins(PORT);
    expect(allowed.has('http://localhost:8000')).toBe(true);
    expect(allowed.has('https://127.0.0.1:8000')).toBe(true);
  });

  it('adds public origin from MCP_ALLOWED_ORIGINS', () => {
    process.env.MCP_ALLOWED_ORIGINS = 'https://my-app.example.com';
    const allowed = getAllowedOrigins(PORT);
    expect(allowed.has('https://my-app.example.com')).toBe(true);
  });
});

describe('isHostAllowed', () => {
  it('allows loopback host', () => {
    const allowed = getAllowedHosts(PORT);
    expect(isHostAllowed('localhost', allowed)).toBe(true);
  });

  it('allows localhost with port', () => {
    const allowed = getAllowedHosts(PORT);
    expect(isHostAllowed('localhost:8000', allowed)).toBe(true);
  });

  it('denies foreign host', () => {
    const allowed = getAllowedHosts(PORT);
    expect(isHostAllowed('attacker.com', allowed)).toBe(false);
  });

  it('denies missing Host header', () => {
    const allowed = getAllowedHosts(PORT);
    expect(isHostAllowed(undefined, allowed)).toBe(false);
  });

  it('denies empty Host header', () => {
    const allowed = getAllowedHosts(PORT);
    expect(isHostAllowed('', allowed)).toBe(false);
  });
});

describe('isOriginAllowed', () => {
  it('allows absent Origin (non-browser client)', () => {
    const allowed = getAllowedOrigins(PORT);
    expect(isOriginAllowed(undefined, allowed)).toBe(true);
  });

  it('allows empty Origin (non-browser client)', () => {
    const allowed = getAllowedOrigins(PORT);
    expect(isOriginAllowed('', allowed)).toBe(true);
  });

  it('allows loopback Origin', () => {
    const allowed = getAllowedOrigins(PORT);
    expect(isOriginAllowed('http://localhost', allowed)).toBe(true);
    expect(isOriginAllowed('http://localhost:8000', allowed)).toBe(true);
  });

  it('denies foreign Origin', () => {
    const allowed = getAllowedOrigins(PORT);
    expect(isOriginAllowed('http://attacker.com', allowed)).toBe(false);
  });

  it('allows origin added via MCP_ALLOWED_ORIGINS', () => {
    const allowed = new Set(['https://my-app.example.com']);
    expect(isOriginAllowed('https://my-app.example.com', allowed)).toBe(true);
  });
});

describe('validateRemoteRequest', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_ALLOWED_HOSTS;
    delete process.env.MCP_ALLOWED_ORIGINS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows legitimate local request (no Origin)', () => {
    const req = createRequest({ host: 'localhost:8000' });
    expect(validateRemoteRequest(req, PORT)).toBe(true);
  });

  it('allows legitimate local request with loopback Origin', () => {
    const req = createRequest({
      host: 'localhost:8000',
      origin: 'http://localhost:8000',
    });
    expect(validateRemoteRequest(req, PORT)).toBe(true);
  });

  it('denies DNS-rebinding shape: foreign Host + foreign Origin', () => {
    const req = createRequest({
      host: 'attacker.com',
      origin: 'http://attacker.com',
    });
    expect(validateRemoteRequest(req, PORT)).toBe(false);
  });

  it('denies foreign Host even with no Origin', () => {
    const req = createRequest({ host: 'attacker.com' });
    expect(validateRemoteRequest(req, PORT)).toBe(false);
  });

  it('denies foreign Origin even with loopback Host', () => {
    const req = createRequest({
      host: 'localhost:8000',
      origin: 'http://attacker.com',
    });
    expect(validateRemoteRequest(req, PORT)).toBe(false);
  });

  it('denies missing Host', () => {
    const req = createRequest({});
    expect(validateRemoteRequest(req, PORT)).toBe(false);
  });

  it('allows public host when MCP_ALLOWED_HOSTS is set', () => {
    process.env.MCP_ALLOWED_HOSTS = 'my-mcp.example.com';
    const req = createRequest({ host: 'my-mcp.example.com' });
    expect(validateRemoteRequest(req, PORT)).toBe(true);
  });
});
