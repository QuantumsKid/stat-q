/**
 * Job Queue Configuration
 * Uses fallback implementation when BullMQ/Redis packages are not available
 *
 * To enable production background job processing:
 * 1. Install packages: npm install bullmq ioredis
 * 2. Set environment variable: REDIS_URL
 * 3. Start workers: npm run workers (implement worker startup script)
 */

import { FallbackQueue, FallbackQueueEvents } from './fallback';

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  ANALYTICS: 'analytics-queue',
  EXPORT: 'export-queue',
  NOTIFICATIONS: 'notifications-queue',
} as const;

// Job types
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface AnalyticsJob {
  formId: string;
  type: 'calculate_stats' | 'generate_report' | 'update_cache';
  options?: Record<string, unknown>;
}

export interface ExportJob {
  formId: string;
  userId: string;
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  filters?: Record<string, unknown>;
}

export interface NotificationJob {
  userId: string;
  type: 'form_response' | 'form_published' | 'export_ready';
  data: Record<string, unknown>;
}

// Create fallback queues
export const emailQueue = new FallbackQueue<EmailJob>(QUEUE_NAMES.EMAIL);
export const analyticsQueue = new FallbackQueue<AnalyticsJob>(QUEUE_NAMES.ANALYTICS);
export const exportQueue = new FallbackQueue<ExportJob>(QUEUE_NAMES.EXPORT);
export const notificationsQueue = new FallbackQueue<NotificationJob>(QUEUE_NAMES.NOTIFICATIONS);

// Queue events (fallback)
export const emailQueueEvents = new FallbackQueueEvents(QUEUE_NAMES.EMAIL);
export const analyticsQueueEvents = new FallbackQueueEvents(QUEUE_NAMES.ANALYTICS);
export const exportQueueEvents = new FallbackQueueEvents(QUEUE_NAMES.EXPORT);
export const notificationsQueueEvents = new FallbackQueueEvents(QUEUE_NAMES.NOTIFICATIONS);

/**
 * Add a job to the email queue
 */
export async function queueEmail(data: EmailJob, options?: { delay?: number; priority?: number }) {
  return await emailQueue.add('send-email', data, options);
}

/**
 * Add a job to the analytics queue
 */
export async function queueAnalytics(data: AnalyticsJob, options?: { delay?: number; priority?: number }) {
  return await analyticsQueue.add('process-analytics', data, options);
}

/**
 * Add a job to the export queue
 */
export async function queueExport(data: ExportJob, options?: { delay?: number; priority?: number }) {
  return await exportQueue.add('process-export', data, options);
}

/**
 * Add a job to the notifications queue
 */
export async function queueNotification(data: NotificationJob, options?: { delay?: number; priority?: number }) {
  return await notificationsQueue.add('send-notification', data, options);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: string) {
  let queue: FallbackQueue;

  switch (queueName) {
    case QUEUE_NAMES.EMAIL:
      queue = emailQueue;
      break;
    case QUEUE_NAMES.ANALYTICS:
      queue = analyticsQueue;
      break;
    case QUEUE_NAMES.EXPORT:
      queue = exportQueue;
      break;
    case QUEUE_NAMES.NOTIFICATIONS:
      queue = notificationsQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const counts = await queue.getJobCounts();

  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: 0, // Fallback doesn't support delayed jobs
    total: counts.waiting + counts.active + counts.completed + counts.failed,
  };
}

/**
 * Clean up old jobs from all queues
 */
export async function cleanQueues() {
  const queues = [emailQueue, analyticsQueue, exportQueue, notificationsQueue];

  await Promise.all(
    queues.map(async (queue) => {
      await queue.clean(3600000, 100, 'completed'); // Clean completed jobs older than 1 hour
      await queue.clean(86400000, 50, 'failed'); // Clean failed jobs older than 24 hours
    })
  );
}

/**
 * Close all queue connections (for graceful shutdown)
 */
export async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    analyticsQueue.close(),
    exportQueue.close(),
    notificationsQueue.close(),
  ]);
}
