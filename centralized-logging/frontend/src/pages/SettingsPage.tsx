import React from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useQueueStats } from '../hooks/useLogs';
import { Shield, Database, Activity } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: queueStats } = useQueueStats();

  return (
    <Layout title="Settings" subtitle="System configuration and info">
      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Shield size={15} className="text-blue-400" /> Account
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Name</p>
              <p className="text-slate-200">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-slate-200">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Role</p>
              <p className="capitalize text-slate-200">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Queue stats (admin only) */}
        {user?.role === 'admin' && queueStats && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Activity size={15} className="text-purple-400" /> Queue Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(queueStats as Record<string, number>).map(([key, val]) => (
                <div key={key} className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 capitalize mb-1">{key}</p>
                  <p className="text-lg font-bold text-slate-200">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System info */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Database size={15} className="text-green-400" /> System Info
          </h3>
          <div className="text-xs text-slate-400 space-y-2 font-mono">
            <p>Version: 1.0.0</p>
            <p>Log Retention: 7 days (TTL index)</p>
            <p>Alert Threshold: 50 errors / 60 seconds</p>
            <p>Queue: BullMQ + Redis</p>
            <p>Database: MongoDB (with compound indexes)</p>
            <p>Realtime: Socket.io (WebSocket)</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
