import { getRequestCircleCIToken } from './requestContext.js';

const MISSING_TOKEN_MESSAGE =
  'CircleCI token is required. Provide Authorization: Bearer <token>, Circle-Token header, or set CIRCLECI_TOKEN.';

/**
 * Resolves the CircleCI token for the current request or process.
 * Request-scoped token takes precedence over CIRCLECI_TOKEN env var.
 */
export function resolveCircleCIToken(): string | undefined {
  const requestToken = getRequestCircleCIToken()?.trim();
  if (requestToken) {
    return requestToken;
  }

  const envToken = process.env.CIRCLECI_TOKEN?.trim();
  if (envToken) {
    return envToken;
  }

  return undefined;
}

export function requireCircleCIToken(): string {
  const token = resolveCircleCIToken();
  if (!token) {
    throw new Error(MISSING_TOKEN_MESSAGE);
  }
  return token;
}

export { MISSING_TOKEN_MESSAGE };
