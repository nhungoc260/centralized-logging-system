import cron from 'node-cron';
import { Log } from '../models/Log';
import { logger } from '../utils/logger';

/**
 * Schedule periodic maintenance tasks
 */
export const setupCronJobs = (): void => {
  const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '7');

  // Run every day at 2:00 AM - delete old logs (belt-and-suspenders alongside TTL index)
  cron.schedule('0 2 * * *', async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);

      const result = await Log.deleteMany({ createdAt: { $lt: cutoff } });
      logger.info(`🗑️  Log retention: deleted ${result.deletedCount} logs older than ${retentionDays} days`);
    } catch (error) {
      logger.error('Log retention job failed:', error);
    }
  });

  logger.info(`⏰ Cron jobs scheduled (log retention: ${retentionDays} days)`);
};
