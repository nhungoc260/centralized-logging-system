import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import path from 'path';

// Load env before other imports
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectMongoDB } from '../config/database';
import { createBullMQConnection } from '../config/redis';
import { LOG_QUEUE_NAME } from '../queues/logQueue';
import { Log } from '../models/Log';
import { alertService } from '../services/alertService';
import { socketService } from '../services/socketService';
import { logger } from '../utils/logger';

interface LogJobData {
  service: string;
  level: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  traceId?: string;
}

const processLogJob = async (job: Job<LogJobData>): Promise<void> => {
  const { service, level, message, timestamp, metadata, traceId } = job.data;

  logger.debug(`Processing log job ${job.id} from service: ${service}`);

  const savedLog = await Log.create({
    service,
    level,
    message,
    timestamp: new Date(timestamp),
    metadata,
    traceId,
  });

  socketService.emitNewLog(savedLog.toJSON());

  if (level === 'error') {
    await alertService.checkErrorThreshold(service);
  }

  logger.debug(`Log ${savedLog.id} saved and emitted`);
};

// ✅ Thêm function này để dùng trong index.ts
export const startEmbeddedWorker = async (): Promise<void> => {
  const worker = new Worker<LogJobData>(
    LOG_QUEUE_NAME,
    processLogJob,
    {
      connection: createBullMQConnection(),
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`✅ Log job ${job.id} processed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Log job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });

  logger.info('🚀 Embedded worker started');
};

const startWorker = async (): Promise<void> => {
  await connectMongoDB();
  await startEmbeddedWorker();
  logger.info('🚀 Log worker started, waiting for jobs...');

  const gracefulShutdown = async () => {
    logger.info('Shutting down worker...');
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startWorker().catch((err) => {
  logger.error('Failed to start worker:', err);
  process.exit(1);
});