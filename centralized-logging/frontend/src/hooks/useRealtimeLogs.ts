import { useState, useEffect, useCallback, useRef } from 'react';
import { socketClient } from '../services/socket';
import { Log, Alert, LogLevel } from '../types';

const MAX_LIVE_LOGS = 200;

interface RealtimeFilters {
  service?: string;
  level?: LogLevel;
}

export const useRealtimeLogs = (filters: RealtimeFilters = {}) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(socketClient.isConnected());
    }, 2000);
    setIsConnected(socketClient.isConnected());
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Subscribe to new logs
    const unsubLog = socketClient.onNewLog((log: Log) => {
      if (isPausedRef.current) return;

      // Apply client-side filters
      if (filters.service && log.service !== filters.service) return;
      if (filters.level && log.level !== filters.level) return;

      setLogs((prev) => [log, ...prev].slice(0, MAX_LIVE_LOGS));
    });

    // Subscribe to alerts
    const unsubAlert = socketClient.onAlert((alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    });

    return () => {
      unsubLog();
      unsubAlert();
    };
  }, [filters.service, filters.level]);

  const clearLogs = useCallback(() => setLogs([]), []);
  const clearAlerts = useCallback(() => setAlerts([]), []);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  return { logs, alerts, isConnected, isPaused, togglePause, clearLogs, clearAlerts };
};
