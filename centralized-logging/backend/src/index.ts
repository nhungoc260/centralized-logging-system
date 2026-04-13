import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectMongoDB } from './config/database';
import { getRedisClient } from './config/redis';
import { setupSocketServer } from './sockets/socketServer';
import { setupCronJobs } from './utils/cronJobs';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { logger } from './utils/logger';

import logRoutes from './routes/logRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const httpServer = http.createServer(app);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/logs', logRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connectedClients: 0,
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3001');

const start = async () => {
  try {
    await connectMongoDB();

    const redis = getRedisClient();
    await redis.ping();
    logger.info('✅ Redis ping successful');

    setupSocketServer(httpServer);

    setupCronJobs();

    // ✅ Thêm dòng này - khởi động worker cùng process
    const { startEmbeddedWorker } = await import('./workers/logWorker');
    await startEmbeddedWorker();

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info('Shutting down server...');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

start();