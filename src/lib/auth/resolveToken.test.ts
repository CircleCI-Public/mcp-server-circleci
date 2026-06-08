import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runWithCircleCIToken } from './requestContext.js';
import {
  MISSING_TOKEN_MESSAGE,
  requireCircleCIToken,
  resolveCircleCIToken,
} from './resolveToken.js';

describe('resolveCircleCIToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CIRCLECI_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should prefer request-scoped token over env token', () => {
    process.env.CIRCLECI_TOKEN = 'env-token';

    const token = runWithCircleCIToken('request-token', () =>
      resolveCircleCIToken(),
    );

    expect(token).toBe('request-token');
  });

  it('should fall back to CIRCLECI_TOKEN when no request token is set', () => {
    process.env.CIRCLECI_TOKEN = 'env-token';

    expect(resolveCircleCIToken()).toBe('env-token');
  });

  it('should return undefined when no token is available', () => {
    expect(resolveCircleCIToken()).toBeUndefined();
  });

  it('should throw a helpful error from requireCircleCIToken when missing', () => {
    expect(() => requireCircleCIToken()).toThrow(MISSING_TOKEN_MESSAGE);
  });

  it('should isolate concurrent request contexts', async () => {
    const results = await Promise.all([
      runWithCircleCIToken('token-a', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return resolveCircleCIToken();
      }),
      runWithCircleCIToken('token-b', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return resolveCircleCIToken();
      }),
    ]);

    expect(results).toEqual(['token-a', 'token-b']);
  });
});
