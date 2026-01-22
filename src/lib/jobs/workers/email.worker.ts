/**
 * Email Worker
 * Processes email sending jobs from the queue
 * Currently using fallback (no-op) implementation
 */

import { FallbackWorker, type Job } from '../fallback';
import type { EmailJob } from '../queue';
import { QUEUE_NAMES } from '../queue';

/**
 * Send email using configured email service
 * This is a placeholder - replace with actual email service (Resend, SendGrid, etc.)
 */
async function sendEmail(data: EmailJob): Promise<void> {
  console.log(`[Fallback] Simulating email send to ${data.to}:`, data.subject);

  // Example using Resend (requires: npm install resend)
  /*
  import { Resend } from 'resend';
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: data.from || 'noreply@statform.ai',
    to: data.to,
    subject: data.subject,
    html: data.html,
  });
  */

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`[Fallback] Email simulated successfully to ${data.to}`);
}

/**
 * Email worker (fallback implementation)
 */
export const emailWorker = new FallbackWorker<EmailJob>(
  QUEUE_NAMES.EMAIL,
  async (job: Job<EmailJob>) => {
    console.log(`Processing email job ${job.id}:`, job.data.subject);

    try {
      await sendEmail(job.data);
      return { success: true, sentTo: job.data.to };
    } catch (error) {
      console.error(`Failed to send email (Job ${job.id}):`, error);
      throw error;
    }
  }
);

// Event listeners (no-op in fallback mode)
emailWorker.on('completed', (job: Job<EmailJob>) => {
  console.log(`Email job completed`);
});

emailWorker.on('failed', (job: Job<EmailJob> | undefined, err: Error) => {
  console.error(`Email job failed:`, err);
});

emailWorker.on('error', (err: Error) => {
  console.error('Email worker error:', err);
});

console.log('[Fallback] Email worker initialized (jobs will be processed synchronously)');
