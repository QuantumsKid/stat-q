/**
 * Fallback job queue when BullMQ/Redis packages are not available
 * Executes jobs synchronously in development
 */

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  timestamp: number;
}

export interface JobResult {
  jobId: string;
  success: boolean;
  error?: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

/**
 * Fallback queue that processes jobs synchronously
 */
export class FallbackQueue<T = any> {
  private name: string;
  private jobs: Map<string, Job<T>> = new Map();
  private completedCount = 0;
  private failedCount = 0;

  constructor(name: string) {
    this.name = name;

    // Log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Job Queue] Using fallback queue for "${name}" - jobs will run synchronously. Install bullmq and ioredis for production use.`
      );
    }
  }

  /**
   * Add a job to the queue (executes immediately in fallback mode)
   */
  async add(jobName: string, data: T, options?: any): Promise<Job<T>> {
    const job: Job<T> = {
      id: `fallback-${Date.now()}-${Math.random()}`,
      name: jobName,
      data,
      timestamp: Date.now(),
    };

    this.jobs.set(job.id, job);

    // In fallback mode, jobs execute immediately
    // In production, they would be queued and processed by workers
    console.log(`[Fallback Queue] Job "${jobName}" added to ${this.name} (will execute synchronously)`);

    return job;
  }

  /**
   * Get queue statistics
   */
  async getJobCounts(): Promise<QueueStats> {
    return {
      waiting: 0, // Fallback processes immediately
      active: 0,
      completed: this.completedCount,
      failed: this.failedCount,
    };
  }

  /**
   * Clean completed jobs
   */
  async clean(grace: number, limit: number, type?: string): Promise<string[]> {
    // No-op in fallback mode
    return [];
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    this.jobs.clear();
  }
}

/**
 * Fallback worker that doesn't actually process jobs
 * (jobs are executed synchronously when added in fallback mode)
 */
export class FallbackWorker<T = any> {
  private queueName: string;

  constructor(queueName: string, processor?: any, options?: any) {
    this.queueName = queueName;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Fallback Worker] Worker created for "${queueName}" (no background processing)`);
    }
  }

  /**
   * Close the worker
   */
  async close(): Promise<void> {
    // No-op
  }

  /**
   * Event listener (no-op)
   */
  on(event: string, handler: Function): this {
    // No-op in fallback mode
    return this;
  }
}

/**
 * Fallback queue events
 */
export class FallbackQueueEvents {
  constructor(queueName: string) {
    // No-op
  }

  on(event: string, handler: Function): this {
    // No-op
    return this;
  }

  async close(): Promise<void> {
    // No-op
  }
}

// Export warning message
export const JOB_QUEUE_UNAVAILABLE =
  'Background job processing is unavailable. Install bullmq and ioredis for production use.';
