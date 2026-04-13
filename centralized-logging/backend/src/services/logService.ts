import { Log, ILog } from '../models/Log';
import { enqueueLog } from '../queues/logQueue';
import { logger } from '../utils/logger';

export interface CreateLogDTO {
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  traceId?: string;
}

export interface LogQueryParams {
  service?: string;
  level?: string;
  search?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}

export interface LogQueryResult {
  logs: ILog[];
  total: number;
  page: number;
  totalPages: number;
}

class LogService {
  /**
   * Ingest a log entry - validate and push to queue
   */
  async ingestLog(data: CreateLogDTO): Promise<void> {
    await enqueueLog({
      service: data.service,
      level: data.level,
      message: data.message,
      timestamp: data.timestamp || new Date(),
      metadata: data.metadata,
      traceId: data.traceId,
    });

    logger.debug(`Log queued: [${data.level}] ${data.service} - ${data.message.substring(0, 50)}`);
  }

  /**
   * Query logs with filtering, pagination and sorting
   */
  async queryLogs(params: LogQueryParams): Promise<LogQueryResult> {
    const {
      service,
      level,
      search,
      startTime,
      endTime,
      page = 1,
      limit = 50,
    } = params;

    // Build MongoDB query
    const query: Record<string, unknown> = {};

    if (service) query.service = service;
    if (level) query.level = level;

    // Time range filter
    if (startTime || endTime) {
      const timeFilter: Record<string, Date> = {};
      if (startTime) timeFilter.$gte = new Date(startTime);
      if (endTime) timeFilter.$lte = new Date(endTime);
      query.timestamp = timeFilter;
    }

    // Full-text search on message
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(query),
    ]);

    return {
      logs: logs as unknown as ILog[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get aggregated stats for dashboard charts
   */
  async getStats(hours = 24, service?: string): Promise<{
    byLevel: { _id: string; count: number }[];
    byService: { _id: string; count: number }[];
    timeline: { _id: string; count: number; errors: number }[];
    totalLogs: number;
    errorRate: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const baseMatch: Record<string, unknown> = { timestamp: { $gte: since } };
    if (service) baseMatch.service = service;

    const [byLevel, byService, timeline, totalLogs] = await Promise.all([
      // Count by log level
      Log.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Count by service
      Log.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Timeline (1-hour buckets)
      Log.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%dT%H:00:00',
                date: '$timestamp',
              },
            },
            count: { $sum: 1 },
            errors: {
              $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Total count
      Log.countDocuments(baseMatch),
    ]);

    const errorCount = byLevel.find((l) => l._id === 'error')?.count || 0;
    const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

    return { byLevel, byService, timeline, totalLogs, errorRate };
  }

  /**
   * Get list of unique service names
   */
  async getServices(): Promise<string[]> {
    return Log.distinct('service');
  }
}

export const logService = new LogService();