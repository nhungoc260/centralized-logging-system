import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

/**
 * Singleton socket service - allows emitting events from anywhere in the app
 * (especially from the worker process)
 */
class SocketService {
  private io: SocketServer | null = null;

  /**
   * Initialize with Socket.io server instance
   */
  init(io: SocketServer): void {
    this.io = io;
    logger.info('Socket service initialized');
  }

  /**
   * Emit a new log to all connected clients (or filtered rooms)
   */
  emitNewLog(log: Record<string, unknown>): void {
    if (!this.io) {
      logger.warn('Socket.io not initialized, skipping emit');
      return;
    }

    // Emit to all clients in the 'logs' room
    this.io.to('logs').emit('new-log', log);

    // Also emit to service-specific room
    if (log.service) {
      this.io.to(`service:${log.service}`).emit('new-log', log);
    }

    // Also emit to level-specific room
    if (log.level) {
      this.io.to(`level:${log.level}`).emit('new-log', log);
    }
  }

  /**
   * Emit an alert to all connected admin clients
   */
  emitAlert(alert: {
    type: string;
    service: string;
    message: string;
    count: number;
    timestamp: Date;
  }): void {
    if (!this.io) return;
    this.io.to('alerts').emit('alert', alert);
  }

  /**
   * Get connected client count
   */
  getConnectedCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }
}

// Export singleton instance
export const socketService = new SocketService();
