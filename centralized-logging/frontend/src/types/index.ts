export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface Log {
  id: string;
  service: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  createdAt: string;
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
  logs: Log[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LogStats {
  byLevel: { _id: string; count: number }[];
  byService: { _id: string; count: number }[];
  timeline: { _id: string; count: number; errors: number }[];
  totalLogs: number;
  errorRate: number;
}

export interface Alert {
  type: string;
  service: string;
  message: string;
  count: number;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'developer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
