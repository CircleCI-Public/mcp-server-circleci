import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Request } from 'express';

import {
  extractCircleCITokenFromRequest,
  isRequestTokenRequired,
} from './extractToken.js';

function createRequest(headers: Record<string, string | undefined>): Request {
  return {
    header(name: string) {
      const normalized = name.toLowerCase();
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === normalized) {
          return value;
        }
      }
      return undefined;
    },
  } as Request;
}

describe('extractCircleCITokenFromRequest', () => {
  it('should extract bearer tokens from Authorization header', () => {
    const req = createRequest({
      authorization: 'Bearer pat-user-123',
    });

    expect(extractCircleCITokenFromRequest(req)).toBe('pat-user-123');
  });

  it('should extract tokens from Circle-Token header', () => {
    const req = createRequest({
      'circle-token': 'pat-user-456',
    });

    expect(extractCircleCITokenFromRequest(req)).toBe('pat-user-456');
  });

  it('should prefer Authorization header over Circle-Token', () => {
    const req = createRequest({
      authorization: 'Bearer pat-from-bearer',
      'circle-token': 'pat-from-circle-token',
    });

    expect(extractCircleCITokenFromRequest(req)).toBe('pat-from-bearer');
  });

  it('should return undefined for malformed bearer headers', () => {
    const req = createRequest({
      authorization: 'Basic abc123',
    });

    expect(extractCircleCITokenFromRequest(req)).toBeUndefined();
  });
});

describe('isRequestTokenRequired', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.REQUIRE_REQUEST_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be true by default (secure by default)', () => {
    expect(isRequestTokenRequired()).toBe(true);
  });

  it('should be true when REQUIRE_REQUEST_TOKEN is true', () => {
    process.env.REQUIRE_REQUEST_TOKEN = 'true';
    expect(isRequestTokenRequired()).toBe(true);
  });

  it('should be false only when explicitly opted out with REQUIRE_REQUEST_TOKEN=false', () => {
    process.env.REQUIRE_REQUEST_TOKEN = 'false';
    expect(isRequestTokenRequired()).toBe(false);
  });

  it('should be true for any non-false value', () => {
    process.env.REQUIRE_REQUEST_TOKEN = 'no';
    expect(isRequestTokenRequired()).toBe(true);
  });
});
