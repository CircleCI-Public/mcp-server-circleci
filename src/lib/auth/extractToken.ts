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

export function isRequestTokenRequired(): boolean {
  return process.env.REQUIRE_REQUEST_TOKEN === 'true';
}
