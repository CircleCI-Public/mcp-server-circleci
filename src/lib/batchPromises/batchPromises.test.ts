import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { batchPromises } from '.';

describe('batchPromises', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes promises in batches respecting maxConcurrent limit', async () => {
    const executionOrder: number[] = [];
    const promises = Array.from(
      { length: 5 },
      (_, i) => () =>
        new Promise<number>((resolve) => {
          executionOrder.push(i);
          resolve(i);
        }),
    );

    const promise = batchPromises(promises, { maxConcurrent: 2 });
    await promise;

    // Should execute in batches of 2
    expect(executionOrder).toEqual([0, 1, 2, 3, 4]);
  });

  it('maintains order of results regardless of completion order', async () => {
    const promises = [
      () => Promise.resolve(1),
      () => new Promise((resolve) => setTimeout(() => resolve(2), 100)),
      () => Promise.resolve(3),
    ];

    const results = await batchPromises(promises, { maxConcurrent: 2 });
    expect(results).toEqual([1, 2, 3]);
  });

  it('respects delay between batches', async () => {
    const executionTimes: number[] = [];
    const promises = Array.from(
      { length: 4 },
      (_, i) => () =>
        new Promise<number>((resolve) => {
          executionTimes.push(Date.now());
          resolve(i);
        }),
    );

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    const promiseExecution = batchPromises(promises, {
      maxConcurrent: 2,
      delayMs: 1000,
    });

    // Fast-forward time to complete all promises
    vi.advanceTimersByTime(2000);
    await promiseExecution;

    // First batch (0,1) executes immediately
    expect(executionTimes[0]).toBe(startTime);
    expect(executionTimes[1]).toBe(startTime);
    // Second batch (2,3) executes after delay
    expect(executionTimes[2]).toBe(startTime + 1000);
    expect(executionTimes[3]).toBe(startTime + 1000);
  });

  it('handles errors in promises', async () => {
    const promises = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error('Test error')),
      () => Promise.resolve(3),
    ];

    await expect(batchPromises(promises, { maxConcurrent: 2 })).rejects.toThrow(
      'Test error',
    );
  });
});
