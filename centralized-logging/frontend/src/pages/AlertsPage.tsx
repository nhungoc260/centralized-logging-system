import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useRealtimeLogs } from '../hooks/useRealtimeLogs';
import { AlertTriangle, Bell, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AlertsPage: React.FC = () => {
  const { alerts, clearAlerts } = useRealtimeLogs();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const visibleAlerts = alerts.filter((_, i) => !dismissed.includes(i));

  const dismissOne = (i: number) => setDismissed(prev => [...prev, i]);

  const toggleExpand = (i: number) => {
    setExpandedIndex(prev => prev === i ? null : i);
  };

  return (
    <Layout title="Alerts" subtitle="System threshold alerts">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-slate-400" />
            <span className="text-sm text-slate-400">{visibleAlerts.length} active alert(s)</span>
          </div>
          {visibleAlerts.length > 0 && (
            <button onClick={clearAlerts} className="btn-ghost text-xs">
              Dismiss all
            </button>
          )}
        </div>

        <div className="card p-4 flex items-start gap-3 border-blue-500/30">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
            <Bell size={15} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Alert Configuration</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Alerts fire when error count exceeds{' '}
              <span className="text-blue-400 font-mono">50 errors / 60 seconds</span> per service.
              A 5-minute cooldown prevents duplicate alerts.
            </p>
          </div>
        </div>

        {visibleAlerts.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-slate-500">
            <CheckCircle size={32} className="text-green-500" />
            <p className="text-sm font-medium text-slate-300">All systems normal</p>
            <p className="text-xs">No alerts have been triggered in this session</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              if (dismissed.includes(i)) return null;
              const isExpanded = expandedIndex === i;
              return (
                <div
                  key={i}
                  className="card border-red-500/20 bg-red-500/5 overflow-hidden"
                >
                  {/* Header - bấm để expand */}
                  <div
                    className="p-4 flex items-start gap-4 cursor-pointer hover:bg-red-500/10 transition-colors"
                    onClick={() => toggleExpand(i)}
                  >
                    <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-300">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Service: <span className="font-mono text-slate-300">{alert.service}</span></span>
                        <span>Count: <span className="text-red-400 font-bold">{alert.count}</span></span>
                        <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      <button
                        onClick={e => { e.stopPropagation(); dismissOne(i); }}
                        className="p-1 hover:bg-red-500/20 rounded"
                      >
                        <X size={14} className="text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Chi tiết khi expand */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-red-500/20 pt-3">
                      <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Alert Details</p>
                      <div className="bg-slate-900/60 rounded-lg p-3 space-y-2 text-xs font-mono">
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-24">Type:</span>
                          <span className="text-yellow-400">ERROR_THRESHOLD</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-24">Service:</span>
                          <span className="text-slate-200">{alert.service}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-24">Error Count:</span>
                          <span className="text-red-400">{alert.count}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-24">Timestamp:</span>
                          <span className="text-slate-200">{new Date(alert.timestamp).toISOString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-500 w-24">Message:</span>
                          <span className="text-slate-200">{alert.message}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};