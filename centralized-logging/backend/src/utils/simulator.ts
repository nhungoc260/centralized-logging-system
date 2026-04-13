/**
 * Multi-Service Log Simulator
 * Sends realistic fake logs to the API to demonstrate the system
 * Usage: npx ts-node src/utils/simulator.ts
 */
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_TOKEN = process.env.SIMULATOR_TOKEN || '';

const SERVICES = [
  'user-service',
  'order-service',
  'payment-service',
  'notification-service',
  'inventory-service',
  'api-gateway',
];

const MESSAGES = {
  info: [
    'Request processed successfully',
    'User logged in',
    'Cache hit for key {key}',
    'Database query completed in {ms}ms',
    'Event published to queue',
    'Health check passed',
  ],
  warn: [
    'High memory usage detected: {pct}%',
    'Slow query detected: {ms}ms',
    'Rate limit approaching for IP {ip}',
    'Retry attempt {n} for operation',
    'Cache miss, falling back to DB',
  ],
  error: [
    'Database connection timeout',
    'Unhandled exception in handler',
    'Payment gateway returned 500',
    'JWT verification failed',
    'Queue worker crashed',
    'Redis connection refused',
  ],
  debug: [
    'Request headers: {headers}',
    'Query params: {params}',
    'Response time: {ms}ms',
  ],
};

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomMessage = (level: string): string => {
  const templates = MESSAGES[level as keyof typeof MESSAGES] || MESSAGES.info;
  return randomFrom(templates)
    .replace('{key}', `user:${Math.floor(Math.random() * 1000)}`)
    .replace('{ms}', String(Math.floor(Math.random() * 2000)))
    .replace('{pct}', String(Math.floor(Math.random() * 40 + 60)))
    .replace('{ip}', `192.168.1.${Math.floor(Math.random() * 255)}`)
    .replace('{n}', String(Math.floor(Math.random() * 3 + 1)))
    .replace('{headers}', JSON.stringify({ 'content-type': 'application/json' }))
    .replace('{params}', JSON.stringify({ page: 1, limit: 10 }));
};

const sendLog = async (service: string, level: string) => {
  const body = {
    service,
    level,
    message: randomMessage(level),
    timestamp: new Date().toISOString(),
    metadata: { simulatorVersion: '1.0', host: `${service}-pod-${Math.floor(Math.random() * 3) + 1}` },
  };

  try {
    const res = await fetch(`${API_URL}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Failed to send log: ${res.status}`);
    } else {
      console.log(`[${level.toUpperCase()}] ${service}: ${body.message}`);
    }
  } catch (err) {
    console.error('Send error:', err);
  }
};

// Weighted level distribution: mostly info, some warns, few errors
const weightedLevel = (): string => {
  const r = Math.random();
  if (r < 0.60) return 'info';
  if (r < 0.80) return 'debug';
  if (r < 0.95) return 'warn';
  return 'error';
};

const run = async () => {
  console.log('🚀 Starting log simulator...');
  console.log(`Target: ${API_URL}`);
  console.log('Press Ctrl+C to stop\n');

  // Send a burst every 500ms
  setInterval(async () => {
    const service = randomFrom(SERVICES);
    const level = weightedLevel();
    await sendLog(service, level);
  }, 500);
};

run().catch(console.error);
