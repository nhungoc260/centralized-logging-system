import { io, Socket } from 'socket.io-client';
import { Log, Alert } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  onNewLog(callback: (log: Log) => void): () => void {
    this.socket?.on('new-log', callback);
    return () => this.socket?.off('new-log', callback);
  }

  onAlert(callback: (alert: Alert) => void): () => void {
    this.socket?.on('alert', callback);
    return () => this.socket?.off('alert', callback);
  }

  subscribeToService(service: string): void {
    this.socket?.emit('subscribe:service', service);
  }

  unsubscribeFromService(service: string): void {
    this.socket?.emit('unsubscribe:service', service);
  }

  subscribeToLevel(level: string): void {
    this.socket?.emit('subscribe:level', level);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
