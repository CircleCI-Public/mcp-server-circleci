type BatchState = {
  batchItemsToFire: any[];
  totalRequests: number;
  completedRequests: number;
};

type BatchOptions = {
  batchSize?: number;
  onProgress?: (progress: {
    totalRequests: number;
    completedRequests: number;
  }) => void;
  onBatchComplete?: (result: {
    startIndex: number;
    stopIndex: number;
    results: any[];
  }) => void;
};

type BatchResult = {
  startIndex: number;
  stopIndex: number;
  results: any[];
};

const RATE_LIMIT_INTERVAL = 2000;
const RATE_LIMIT_MAX_REQUESTS = 40;

const ifAllItemsArePopulated = (
  batchState: BatchState,
  startIndex: number,
  endIndex: number,
): boolean => {
  for (let i = startIndex; i < endIndex; i++) {
    if (
      i < batchState.batchItemsToFire.length &&
      batchState.batchItemsToFire[i] === undefined
    ) {
      return false;
    }
  }
  return true;
};

const onProgressFired = (
  batchState: BatchState,
  startIndex: number,
  endIndex: number,
  onProgress: (data: {
    totalRequests: number;
    completedRequests: number;
  }) => void,
): void => {
  batchState.completedRequests += endIndex - startIndex;
  const data = {
    totalRequests: batchState.totalRequests,
    completedRequests: batchState.completedRequests,
  };
  onProgress(data);
};

const onBatchCompleteFired = (
  batchState: BatchState,
  batchItems: any[],
  startIndex: number,
  endIndex: number,
  batchSize: number,
  onBatchComplete: (result: BatchResult) => void,
): void => {
  for (let i = startIndex; i < endIndex; i++) {
    batchState.batchItemsToFire[i] = batchItems[i - startIndex];
  }

  for (let i = 0; i < batchState.batchItemsToFire.length; i = i + batchSize) {
    const batchEndIndex = i + batchSize;
    const allItemsArePopulated = ifAllItemsArePopulated(
      batchState,
      i,
      batchEndIndex,
    );
    if (allItemsArePopulated) {
      const batch = batchState.batchItemsToFire.slice(i, batchEndIndex);
      const result = {
        startIndex: i,
        stopIndex: Math.min(
          batchEndIndex - 1,
          batchState.batchItemsToFire.length - 1,
        ),
        results: batch,
      };
      for (let j = 0; j < batchEndIndex; j++) {
        batchState.batchItemsToFire[j] = undefined;
      }
      onBatchComplete(result);
    }
  }
};

const onBatchFinish = (
  batchState: BatchState,
  batch: Promise<any>[],
  options: BatchOptions | undefined,
  startIndex: number,
  endIndex: number,
): void => {
  Promise.all(batch).then((batchItems) => {
    if (options?.batchSize && options.onBatchComplete) {
      onBatchCompleteFired(
        batchState,
        batchItems,
        startIndex,
        endIndex,
        options.batchSize,
        options.onBatchComplete,
      );
    }
    if (options?.onProgress) {
      onProgressFired(batchState, startIndex, endIndex, options.onProgress);
    }
  });
};

export const rateLimitedRequests = async <T>(
  requests: (() => Promise<T>)[],
  maxRequests = RATE_LIMIT_MAX_REQUESTS,
  interval = RATE_LIMIT_INTERVAL,
  options?: BatchOptions,
): Promise<T[]> => {
  const batchState: BatchState = {
    batchItemsToFire: new Array(requests.length),
    totalRequests: requests.length,
    completedRequests: 0,
  };

  const result = new Array(requests.length);
  const promises: Promise<T>[] = [];

  for (
    let startIndex = 0;
    startIndex < requests.length;
    startIndex += maxRequests
  ) {
    const endIndex = Math.min(startIndex + maxRequests, requests.length);
    const batch = requests.slice(startIndex, endIndex).map((execute, index) =>
      Promise.resolve(execute()).then((res) => {
        result[startIndex + index] = res;
        return res;
      }),
    );

    onBatchFinish(batchState, batch, options, startIndex, endIndex);
    promises.push(...batch);

    if (endIndex < requests.length) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  await Promise.all(promises);
  return result;
};
