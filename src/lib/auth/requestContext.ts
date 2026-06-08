import { AsyncLocalStorage } from 'node:async_hooks';

const requestTokenStorage = new AsyncLocalStorage<string>();

/**
 * Returns the CircleCI token from the current async request context, if set.
 */
export function getRequestCircleCIToken(): string | undefined {
  return requestTokenStorage.getStore();
}

/**
 * Runs fn with the given CircleCI token available to the current async chain.
 */
export function runWithCircleCIToken<T>(
  token: string,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return requestTokenStorage.run(token, fn);
}
