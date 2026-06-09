import type { Request } from 'express';

/**
 * Extracts a CircleCI PAT from incoming HTTP request headers.
 * Supports Authorization: Bearer <token> and Circle-Token: <token>.
 */
export function extractCircleCITokenFromRequest(
  req: Request,
): string | undefined {
  const authorization = req.header('authorization');
  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    const bearerToken = match?.[1]?.trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  const circleToken = req.header('circle-token');
  if (circleToken?.trim()) {
    return circleToken.trim();
  }

  return undefined;
}

/**
 * Whether the remote HTTP transport must reject requests that carry no
 * CircleCI token. Secure by default: a request token is required unless an
 * operator explicitly opts out with REQUIRE_REQUEST_TOKEN=false (the
 * "shared token" deployment). Only consulted by the remote transport.
 */
export function isRequestTokenRequired(): boolean {
  return process.env.REQUIRE_REQUEST_TOKEN !== 'false';
}
