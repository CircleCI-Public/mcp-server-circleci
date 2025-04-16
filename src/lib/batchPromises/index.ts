/**
 * Executes an array of promise-returning functions in batches while respecting rate limits
 * @param promises Array of functions that return promises to execute
 * @param rateLimitParams Object containing rate limit parameters
 * @param rateLimitParams.maxConcurrent Maximum number of concurrent promises to execute
 * @param rateLimitParams.delayMs Optional delay between batches in milliseconds, defaults to 0
 * @returns Promise that resolves with an array containing the results of all promises in the same order
 */
export async function batchPromises<T>(
  promises: (() => Promise<T>)[],
  rateLimitParams: {
    maxConcurrent: number;
    delayMs?: number;
  },
): Promise<T[]> {
  const { maxConcurrent, delayMs = 0 } = rateLimitParams;
  const results: T[] = [];
  const inProgress = new Set<Promise<void>>();

  for (let i = 0; i < promises.length; i++) {
    // If we've hit the concurrent limit, wait for one to finish
    if (inProgress.size >= maxConcurrent) {
      await Promise.race(Array.from(inProgress));
      // Add delay when we hit the concurrent limit
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Create and track this promise
    const promise = promises[i]().then((result) => {
      results[i] = result;
      inProgress.delete(promiseTracker);
    });
    const promiseTracker = promise.catch((error) => {
      inProgress.delete(promiseTracker);
      throw error;
    });

    inProgress.add(promiseTracker);
  }

  // Wait for any remaining promises
  await Promise.all(Array.from(inProgress));
  return results;
}
