import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { authService } from '../services/authService';
import { socketService } from '../services/socketService';
import { logger } from '../utils/logger';

/**
 * Setup Socket.io server with authentication and room management
 */
export const setupSocketServer = (httpServer: HttpServer): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ---- JWT Authentication Middleware ----
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = authService.verifyToken(token);
      // Attach user info to socket
      (socket as typeof socket & { user: typeof payload }).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ---- Connection Handler ----
  io.on('connection', (socket) => {
    const user = (socket as typeof socket & { user: { userId: string; email: string; role: string } }).user;
    logger.info(`Socket connected: ${socket.id} (user: ${user.email})`);

    // Auto-join global logs room
    socket.join('logs');

    // Auto-join alerts room
    socket.join('alerts');

    // ---- Room: Filter by service ----
    socket.on('subscribe:service', (service: string) => {
      if (typeof service === 'string' && service.trim()) {
        socket.join(`service:${service.trim()}`);
        logger.debug(`${user.email} subscribed to service: ${service}`);
      }
    });

    socket.on('unsubscribe:service', (service: string) => {
      socket.leave(`service:${service}`);
    });

    // ---- Room: Filter by level ----
    socket.on('subscribe:level', (level: string) => {
      const validLevels = ['info', 'warn', 'error', 'debug'];
      if (validLevels.includes(level)) {
        socket.join(`level:${level}`);
        logger.debug(`${user.email} subscribed to level: ${level}`);
      }
    });

    socket.on('unsubscribe:level', (level: string) => {
      socket.leave(`level:${level}`);
    });

    // ---- Ping/Pong for health check ----
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  // Initialize the singleton socket service with this io instance
  socketService.init(io);

  logger.info('🔌 Socket.io server initialized');
  return io;
};
