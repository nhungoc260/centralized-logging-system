import { useQuery } from '@tanstack/react-query';
import { logsAPI } from '../services/api';
import { LogQueryParams, LogQueryResult, LogStats } from '../types';

export const useLogs = (params: LogQueryParams) => {
  return useQuery<LogQueryResult>({
    queryKey: ['logs', params],
    queryFn: async () => {
      const res = await logsAPI.query(params as Record<string, unknown>);
      return res.data.data;
    },
    refetchInterval: 15000, // auto-refresh every 15s
  });
};

export const useLogStats = (hours = 24) => {
  return useQuery<LogStats>({
    queryKey: ['log-stats', hours],
    queryFn: async () => {
      const res = await logsAPI.getStats(hours);
      return res.data.data;
    },
    refetchInterval: 30000,
  });
};

export const useServices = () => {
  return useQuery<string[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await logsAPI.getServices();
      return res.data.data;
    },
    staleTime: 60000,
  });
};

export const useQueueStats = () => {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const res = await logsAPI.getQueueStats();
      return res.data.data;
    },
    refetchInterval: 5000,
  });
};
