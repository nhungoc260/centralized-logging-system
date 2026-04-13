import nodemailer from 'nodemailer';
import { getRedisClient } from '../config/redis';
import { socketService } from './socketService';
import { logger } from '../utils/logger';

const ERROR_THRESHOLD = parseInt(process.env.ERROR_THRESHOLD || '50');
const ERROR_WINDOW_SECONDS = parseInt(process.env.ERROR_WINDOW_SECONDS || '60');

class AlertService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initMailer();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initMailer(): void {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info('Email transporter initialized');
    } else {
      logger.warn('Email not configured, alerts will only be logged');
    }
  }

  /**
   * Track error count per service using Redis sliding window
   * and trigger alert if threshold exceeded
   */
  async checkErrorThreshold(service: string): Promise<void> {
    const redis = getRedisClient();
    const key = `error_count:${service}`;
    const now = Date.now();
    const windowStart = now - ERROR_WINDOW_SECONDS * 1000;

    try {
      // Add current error timestamp to sorted set
      await redis.zadd(key, now, `${now}`);

      // Remove entries outside the window
      await redis.zremrangebyscore(key, '-inf', windowStart);

      // Set expiry on the key
      await redis.expire(key, ERROR_WINDOW_SECONDS * 2);

      // Count errors in window
      const errorCount = await redis.zcard(key);

      logger.debug(`Service ${service}: ${errorCount} errors in last ${ERROR_WINDOW_SECONDS}s`);

      // Check if threshold exceeded and alert not already sent
      const alertKey = `alert_sent:${service}`;
      const alertAlreadySent = await redis.get(alertKey);

      if (errorCount >= ERROR_THRESHOLD && !alertAlreadySent) {
        // Set cooldown to prevent alert spam (5 minutes)
        await redis.setex(alertKey, 300, '1');

        const alertData = {
          type: 'ERROR_THRESHOLD',
          service,
          message: `🚨 Alert: ${errorCount} errors in ${ERROR_WINDOW_SECONDS}s for service "${service}"`,
          count: errorCount,
          timestamp: new Date(),
        };

        logger.warn(alertData.message);

        // Emit socket alert to dashboard
        socketService.emitAlert(alertData);

        // Send email alert
        await this.sendEmailAlert(alertData);

        // Send Telegram alert
        await this.sendTelegramAlert(alertData);
      }
    } catch (error) {
      logger.error('Alert check failed:', error);
    }
  }

  /**
   * Send email alert via Nodemailer
   */
  private async sendEmailAlert(alert: {
    service: string;
    message: string;
    count: number;
    timestamp: Date;
  }): Promise<void> {
    if (!this.transporter || !process.env.ALERT_EMAIL_TO) return;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL_TO,
        subject: `🚨 [Alert] High Error Rate - Service: ${alert.service}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #dc2626;">🚨 Error Rate Alert</h2>
            <p><strong>Service:</strong> ${alert.service}</p>
            <p><strong>Error Count:</strong> ${alert.count} errors in the last ${ERROR_WINDOW_SECONDS} seconds</p>
            <p><strong>Threshold:</strong> ${ERROR_THRESHOLD} errors/${ERROR_WINDOW_SECONDS}s</p>
            <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">Centralized Logging System - Auto Alert</p>
          </div>
        `,
      });
      logger.info(`Alert email sent for service: ${alert.service}`);
    } catch (error) {
      logger.error('Failed to send alert email:', error);
    }
  }

  /**
   * Send Telegram alert via Bot API
   */
  private async sendTelegramAlert(alert: {
    service: string;
    message: string;
    count: number;
    timestamp: Date;
  }): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    const text = `
🚨 *Error Rate Alert*

*Service:* ${alert.service}
*Count:* ${alert.count} errors / ${ERROR_WINDOW_SECONDS}s
*Threshold:* ${ERROR_THRESHOLD}
*Time:* ${alert.timestamp.toISOString()}

_Centralized Logging System_
    `.trim();

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      logger.info(`Telegram alert sent for service: ${alert.service}`);
    } catch (error) {
      logger.error('Failed to send Telegram alert:', error);
    }
  }
}

export const alertService = new AlertService();
