import { describe, test, expect, vi, beforeAll } from 'vitest';
import { rateLimitedRequests } from '.';

type MockResponse = {
  ok: boolean;
  json: () => Promise<{ args: Record<string, string | string[]> }>;
};

const mockFetch = (url: string): Promise<MockResponse> => {
  return Promise.resolve({
    ok: true,
    json: () => {
      const params = url.split('?')[1].split('&');
      const paramsMap = params.reduce<Record<string, string | string[]>>(
        (map, paramPair) => {
          const values = paramPair.split('=');
          if (map[values[0]] && Array.isArray(map[values[0]])) {
            (map[values[0]] as string[]).push(values[1]);
          } else if (map[values[0]] && !Array.isArray(map[values[0]])) {
            map[values[0]] = [map[values[0]] as string, values[1]];
          } else {
            map[values[0]] = values[1];
          }
          return map;
        },
        {},
      );
      return Promise.resolve({ args: paramsMap });
    },
  });
};

// Test configuration
beforeAll(() => {
  vi.setConfig({ testTimeout: 60000 });
});

const maxRetries = 2;
const retryDelayInMillis = 500;
const requestURL = `https://httpbin.org/get`;

// Helper functions
function generateRequests(numberOfRequests: number): (() => Promise<any>)[] {
  return Array.from(
    { length: numberOfRequests },
    (_, i) => () => makeRequest(i),
  );
}

async function makeRequest(
  requestId: number,
  attempt = 1,
): Promise<{ args: any } | { error: any }> {
  try {
    const response = await mockFetch(requestURL + '?id=' + requestId);
    if (!response.ok) {
      throw new Error(`HTTP error occurred`);
    }
    return await response.json();
  } catch (error) {
    if (attempt <= maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayInMillis));
      return makeRequest(requestId, attempt + 1);
    } else {
      return {
        error: error instanceof Error ? error.toString() : String(error),
      };
    }
  }
}

function isResponseContainData(
  result: any[],
  startIndex: number,
  endIndex: number,
): boolean {
  for (let i = startIndex; i <= endIndex; i++) {
    const resultItem = JSON.stringify(result[i - startIndex]);
    if (!resultItem || !resultItem.includes(`{"args":{"id":"${i}"}`)) {
      return false;
    }
  }
  return true;
}

function isBatchResponseContainData(
  batchItems: any[],
  startIndex: number,
  endIndex: number,
): boolean {
  return batchItems.some(
    (batchItem) =>
      batchItem.startIndex === startIndex &&
      batchItem.stopIndex === endIndex &&
      isResponseContainData(batchItem.results, startIndex, endIndex),
  );
}

function checkProgressItems(
  progressItems: any[],
  maxRequests: number,
  totalRequests: number,
  expectedProgressItemsCount: number,
): void {
  expect(progressItems.length).toBe(expectedProgressItemsCount);
  for (let i = 0; i < expectedProgressItemsCount; i++) {
    expect(progressItems[i].totalRequests).toBe(totalRequests);
    expect(progressItems[i].completedRequests).toBe((1 + i) * maxRequests);
  }
}

function checkBatchItems(
  batchItems: any[],
  batchSize: number,
  totalRequests: number,
): void {
  expect(batchItems.length).toBe(Math.ceil(totalRequests / batchSize));
  for (const batch of batchItems) {
    const expectedSize = Math.min(batchSize, totalRequests - batch.startIndex);
    expect(batch.results.length).toBe(expectedSize);
    const result = isResponseContainData(
      batch.results,
      batch.startIndex,
      batch.stopIndex,
    );
    if (!result) {
      console.log('items ' + JSON.stringify(batchItems));
      console.log(
        `startIndex ${batch.startIndex}, endIndex ${batch.stopIndex}`,
      );
    }
    expect(result).toBe(true);
  }
}

// Options creator
function createOptions(
  batchSize?: number,
  onProgress?: (progress: {
    totalRequests: number;
    completedRequests: number;
  }) => void,
  onBatchComplete?: (batch: {
    startIndex: number;
    stopIndex: number;
    results: any[];
  }) => void,
) {
  return { batchSize, onProgress, onBatchComplete };
}

describe('rateLimitedRequests', () => {
  test('execute 50 requests', async () => {
    const requests = generateRequests(50);
    const result = await rateLimitedRequests(
      requests,
      25,
      1000,
      createOptions(),
    );

    expect(result.length).toBe(50);
    expect(isResponseContainData(result, 0, 49)).toBe(true);
  });

  test('execute 1000 requests', async () => {
    const requests = generateRequests(1000);
    const batchItems: any[] = [];
    const progressItems: any[] = [];

    const result = await rateLimitedRequests(
      requests,
      100,
      100,
      createOptions(
        50,
        (progress) => progressItems.push(progress),
        (batch) => batchItems.push(batch),
      ),
    );

    expect(result.length).toBe(1000);
    expect(isResponseContainData(result, 0, 999)).toBe(true);
    expect(batchItems.length).toBe(20);

    for (const batch of batchItems) {
      expect(batch.results.length).toBe(50);
      expect(
        isResponseContainData(batch.results, batch.startIndex, batch.stopIndex),
      ).toBe(true);
    }

    checkProgressItems(progressItems, 100, 1000, 10);
  }, 30000);

  describe('with batch', () => {
    test('execute 50 requests with batch', async () => {
      const requests = generateRequests(50);
      const batchItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        25,
        1000,
        createOptions(10, undefined, (batch) => batchItems.push(batch)),
      );

      expect(result.length).toBe(50);
      expect(batchItems.length).toBe(5);
      checkBatchItems(batchItems, 10, 50);
    });

    test('batchSize bigger than total requests', async () => {
      const requests = generateRequests(50);
      const batchItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        25,
        1000,
        createOptions(60, undefined, (batch) => batchItems.push(batch)),
      );

      expect(result.length).toBe(50);
      expect(batchItems.length).toBe(1);
      expect(batchItems[0].results.length).toBe(50);
    });

    test('batchSize equals to total requests', async () => {
      const requests = generateRequests(50);
      const batchItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        25,
        1000,
        createOptions(50, undefined, (batch) => batchItems.push(batch)),
      );

      expect(result.length).toBe(50);
      expect(batchItems.length).toBe(1);
      isBatchResponseContainData(batchItems, 0, 49);
    });

    test('with onProgress callback', async () => {
      const requests = generateRequests(50);
      const progressItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        25,
        1000,
        createOptions(50, (progress) => progressItems.push(progress)),
      );

      expect(result.length).toBe(50);
      checkProgressItems(progressItems, 25, 50, 2);
    });
  });

  describe('batch processing', () => {
    test('should process empty batch items correctly', async () => {
      const requests = generateRequests(30);
      const batchItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        10,
        1000,
        createOptions(10, undefined, (batch) => batchItems.push(batch)),
      );

      expect(result.length).toBe(30);
      expect(batchItems.length).toBe(3);
      for (const batchItem of batchItems) {
        expect(batchItem.results.length).toBe(10);
      }
    });

    test('should handle partial batch correctly', async () => {
      const requests = generateRequests(25);
      const batchItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        10,
        1000,
        createOptions(10, undefined, (batch) => batchItems.push(batch)),
      );

      expect(result.length).toBe(25);
      expect(batchItems.length).toBe(3);
      expect(batchItems[2].results.length).toBe(5); // Last batch should have 5 items
    });
  });

  describe('progress tracking', () => {
    test('should track progress correctly with uneven batches', async () => {
      const requests = generateRequests(25);
      const progressItems: any[] = [];

      const result = await rateLimitedRequests(
        requests,
        10,
        1000,
        createOptions(undefined, (progress) => progressItems.push(progress)),
      );

      expect(result.length).toBe(25);
      expect(progressItems.length).toBe(3);
      expect(progressItems[0].completedRequests).toBe(10);
      expect(progressItems[1].completedRequests).toBe(20);
      expect(progressItems[2].completedRequests).toBe(25);
      expect(progressItems[2].totalRequests).toBe(25);
    });
  });

  describe('error cases', () => {
    test('options not passed', async () => {
      const requests = generateRequests(5);
      const result = await rateLimitedRequests(requests, 25, 1000);
      expect(result.length).toBe(5);
    });

    test('should handle undefined options gracefully', async () => {
      const requests = generateRequests(5);
      const result = await rateLimitedRequests(requests, 25, 1000, undefined);
      expect(result.length).toBe(5);
    });

    test('should handle empty batch size gracefully', async () => {
      const requests = generateRequests(5);
      const result = await rateLimitedRequests(
        requests,
        25,
        1000,
        createOptions(0),
      );
      expect(result.length).toBe(5);
    });
  });
});
