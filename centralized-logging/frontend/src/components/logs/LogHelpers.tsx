import React from 'react';
import { LogLevel } from '../../types';
import { format } from 'date-fns';

export const LevelBadge: React.FC<{ level: LogLevel }> = ({ level }) => {
  const cls: Record<LogLevel, string> = {
    info:  'badge-info',
    warn:  'badge-warn',
    error: 'badge-error',
    debug: 'badge-debug',
  };
  return <span className={cls[level]}>{level.toUpperCase()}</span>;
};

export const ServiceBadge: React.FC<{ service: string }> = ({ service }) => (
  <span className="bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded text-xs font-mono">
    {service}
  </span>
);

export const TimeStamp: React.FC<{ ts: string }> = ({ ts }) => (
  <span className="font-mono text-xs text-slate-500" title={ts}>
    {format(new Date(ts), 'HH:mm:ss.SSS')}
  </span>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, color = 'text-white', icon }) => (
  <div className="card p-5 flex items-start gap-4">
    {icon && (
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);
