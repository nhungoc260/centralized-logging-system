import { Queue, QueueEvents } from 'bullmq';
import { createBullMQConnection } from '../config/redis';
import { logger } from '../utils/logger';

export const LOG_QUEUE_NAME = 'log-processing';

// Create the log queue
export const logQueue = new Queue(LOG_QUEUE_NAME, {
  connection: createBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,                    // retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 1000,                  // start with 1s delay
    },
    removeOnComplete: { count: 100 }, // keep last 100 completed jobs
    removeOnFail: { count: 50 },      // keep last 50 failed jobs
  },
});

// Queue event listeners for monitoring
const queueEvents = new QueueEvents(LOG_QUEUE_NAME, {
  connection: createBullMQConnection(),
});

queueEvents.on('completed', ({ jobId }) => {
  logger.debug(`Job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed: ${failedReason}`);
});

/**
 * Add a log entry to the processing queue
 */
export const enqueueLog = async (logData: {
  service: string;
  level: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  traceId?: string;
}): Promise<void> => {
  try {
    await logQueue.add('process-log', logData, {
      priority: logData.level === 'error' ? 1 : 2, // errors get higher priority
    });
    logger.debug(`Log enqueued for service: ${logData.service}`);
  } catch (error) {
    logger.error('Failed to enqueue log:', error);
    throw error;
  }
};

/**
 * Get queue stats for monitoring
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    logQueue.getWaitingCount(),
    logQueue.getActiveCount(),
    logQueue.getCompletedCount(),
    logQueue.getFailedCount(),
    logQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
};
