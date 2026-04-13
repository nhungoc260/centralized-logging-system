import React from 'react';
import { Layout } from '../components/layout/Layout';
import { StatCard } from '../components/logs/LogHelpers';
import { TimelineChart, LevelDistributionChart, ServiceChart } from '../components/charts/Charts';
import { LiveStream } from '../components/logs/LiveStream';
import { AlertBanner } from '../components/alerts/AlertBanner';
import { useLogStats } from '../hooks/useLogs';
import { useRealtimeLogs } from '../hooks/useRealtimeLogs';
import { Activity, AlertTriangle, Database, TrendingUp, Loader2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useLogStats(24);
  const { alerts, clearAlerts } = useRealtimeLogs();

  return (
    <Layout title="Dashboard" subtitle="Real-time system overview">
      <AlertBanner alerts={alerts} onDismiss={clearAlerts} />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total Logs (24h)"
              value={stats.totalLogs.toLocaleString()}
              color="text-blue-400"
              icon={<Database size={18} className="text-blue-400" />}
            />
            <StatCard
              label="Error Rate"
              value={`${stats.errorRate.toFixed(1)}%`}
              color={stats.errorRate > 10 ? 'text-red-400' : 'text-green-400'}
              icon={<AlertTriangle size={18} className={stats.errorRate > 10 ? 'text-red-400' : 'text-green-400'} />}
            />
            <StatCard
              label="Services"
              value={stats.byService.length}
              color="text-purple-400"
              icon={<Activity size={18} className="text-purple-400" />}
            />
            <StatCard
              label="Errors (24h)"
              value={(stats.byLevel.find((l) => l._id === 'error')?.count || 0).toLocaleString()}
              color="text-red-400"
              icon={<TrendingUp size={18} className="text-red-400" />}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TimelineChart stats={stats} />
            </div>
            <LevelDistributionChart stats={stats} />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ServiceChart stats={stats} />
            <div style={{ height: 340 }}>
              <LiveStream />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">No data available</div>
      )}
    </Layout>
  );
};
