/**
 * Worker Manager
 * Centralized management for all background job workers
 * Currently using fallback implementation
 */

import { emailWorker } from './workers/email.worker';
import { analyticsWorker } from './workers/analytics.worker';

export const workers = {
  email: emailWorker,
  analytics: analyticsWorker,
};

/**
 * Start all workers
 */
export async function startWorkers() {
  console.log('[Fallback] Workers initialized (jobs will be processed synchronously)');

  // Workers are started when imported
  // This function can be used for additional initialization

  return workers;
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers() {
  console.log('Stopping all background workers...');

  await Promise.all([
    emailWorker.close(),
    analyticsWorker.close(),
  ]);

  console.log('All workers stopped');
}

/**
 * Get health status of all workers
 * Returns fallback status in development mode
 */
export async function getWorkersHealth() {
  return {
    email: {
      isRunning: true, // Fallback workers are always "running"
      isPaused: false,
      type: 'fallback',
    },
    analytics: {
      isRunning: true,
      isPaused: false,
      type: 'fallback',
    },
  };
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down workers...');
  await stopWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down workers...');
  await stopWorkers();
  process.exit(0);
});
