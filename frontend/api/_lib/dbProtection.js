/**
 * GradeFlow Serverless Database Protection & Async Concurrency Semaphore
 * - Limits concurrent active MongoDB queries to prevent connection exhaustion
 * - Bounded memory queue with timeout and overflow protection
 */

class DatabaseOverloadError extends Error {
  constructor(message = "Server is handling high traffic. Please try again shortly.") {
    super(message);
    this.name = "DatabaseOverloadError";
    this.code = "DB_OVERLOAD";
    this.statusCode = 429;
  }
}

class AsyncDatabaseQueue {
  constructor(options = {}) {
    this.maxConcurrent = Number(options.maxConcurrent || process.env.DB_MAX_PARALLEL_QUERIES) || 45;
    this.maxQueueSize = Number(options.maxQueueSize || process.env.DB_MAX_QUEUE_SIZE) || 200;
    this.queueTimeoutMs = Number(options.queueTimeoutMs || process.env.DB_QUEUE_TIMEOUT_MS) || 2500;
    this.activeCount = 0;
    this.queue = [];
  }

  async run(queryFn) {
    if (this.activeCount < this.maxConcurrent) {
      return this._execute(queryFn);
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new DatabaseOverloadError(
        "GradeFlow is experiencing very high traffic. Please try again in a few seconds."
      );
    }

    return new Promise((resolve, reject) => {
      const queueItem = {
        queryFn,
        resolve,
        reject,
        timer: null,
      };

      queueItem.timer = setTimeout(() => {
        const idx = this.queue.indexOf(queueItem);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
        reject(
          new DatabaseOverloadError(
            "Query request timed out during high traffic. Please try again shortly."
          )
        );
      }, this.queueTimeoutMs);

      this.queue.push(queueItem);
    });
  }

  async _execute(queryFn) {
    this.activeCount++;
    try {
      return await queryFn();
    } finally {
      this.activeCount--;
      this._processNext();
    }
  }

  _processNext() {
    if (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const nextItem = this.queue.shift();
      if (nextItem) {
        clearTimeout(nextItem.timer);
        this._execute(nextItem.queryFn)
          .then(nextItem.resolve)
          .catch(nextItem.reject);
      }
    }
  }

  getStats() {
    return {
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
    };
  }
}

// Cached global serverless queue
if (!global.gradeflowDbQueue) {
  global.gradeflowDbQueue = new AsyncDatabaseQueue();
}
const globalDbQueue = global.gradeflowDbQueue;

module.exports = {
  DatabaseOverloadError,
  AsyncDatabaseQueue,
  globalDbQueue,
};
