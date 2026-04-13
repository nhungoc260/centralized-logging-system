import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logService } from '../services/logService';
import { getQueueStats } from '../queues/logQueue';
import { logger } from '../utils/logger';

export const logController = {
  /**
   * POST /api/logs
   * Ingest a new log entry
   */
  async ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { service, level, message, timestamp, metadata, traceId } = req.body;

      await logService.ingestLog({
        service,
        level,
        message,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        metadata,
        traceId,
      });

      res.status(202).json({
        success: true,
        message: 'Log accepted for processing',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/logs/batch
   * Ingest multiple logs at once
   */
  async ingestBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { logs } = req.body;

      if (!Array.isArray(logs) || logs.length === 0) {
        res.status(400).json({ success: false, message: 'logs must be a non-empty array' });
        return;
      }

      if (logs.length > 100) {
        res.status(400).json({ success: false, message: 'Maximum 100 logs per batch' });
        return;
      }

      await Promise.all(logs.map((log) => logService.ingestLog(log)));

      res.status(202).json({
        success: true,
        message: `${logs.length} logs accepted for processing`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/logs
   * Query logs with filters and pagination
   */
  async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { service, level, search, startTime, endTime, page, limit } = req.query;

      const result = await logService.queryLogs({
        service: service as string,
        level: level as string,
        search: search as string,
        startTime: startTime as string,
        endTime: endTime as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? Math.min(parseInt(limit as string), 200) : 50,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/logs/stats
   * Get aggregated stats for dashboard
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const service = req.query.service as string | undefined;
      const stats = await logService.getStats(hours, service);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/logs/services
   * Get list of services
   */
  async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = await logService.getServices();
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/logs/queue-stats
   * Get BullMQ queue statistics (admin only)
   */
  async getQueueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await getQueueStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};

// DELETE /api/logs - bulk delete logs (admin only)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const deleteLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { service, level } = req.body;
    const filter: Record<string, string> = {};
    if (service) filter.service = service;
    if (level) filter.level = level;
    const result = await (await import('../models/Log')).Log.deleteMany(filter);
    res.json({ success: true, data: { deletedCount: result.deletedCount } });
  } catch (e) { next(e); }
};

// Proper delete handler using query params
export const deleteLogsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { service, level, before } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (service) filter.service = service;
    if (level) filter.level = level;
    if (before) filter.timestamp = { $lt: new Date(before) };
    const { Log } = await import('../models/Log');
    const result = await Log.deleteMany(filter);
    res.json({ success: true, data: { deletedCount: result.deletedCount } });
  } catch (e) { next(e); }
};