import React, { useState, useRef, useEffect } from 'react';
import { Bell, Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRealtimeLogs } from '../../hooks/useRealtimeLogs';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { isConnected, alerts, clearAlerts } = useRealtimeLogs();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0 relative z-30">
      <div>
        <h1 className="text-base font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost p-2 disabled:opacity-50"
          title="Refresh all data"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-400' : ''} />
        </button>

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowBell(s => !s)}
            className={`relative btn-ghost p-2 ${showBell ? 'bg-slate-800 text-slate-200' : ''}`}
            title="Notifications"
          >
            <Bell size={15} />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                {alerts.length > 0 && (
                  <button onClick={() => { clearAlerts(); setShowBell(false); }}
                    className="text-xs text-slate-500 hover:text-slate-300">
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
                    <CheckCircle size={24} className="text-green-500" />
                    <p className="text-sm">All systems normal</p>
                    <p className="text-xs">No alerts triggered</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30">
                      <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-300 leading-relaxed">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded">{alert.service}</span>
                          <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Connection status */}
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          isConnected
            ? 'text-green-400 bg-green-500/10 border-green-500/30'
            : 'text-red-400 bg-red-500/10 border-red-500/30'
        }`}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? 'Live' : 'Offline'}</span>
          {isConnected && <span className="live-dot ml-0.5" />}
        </div>
      </div>
    </header>
  );
};