import React, { useRef, useEffect } from 'react';
import { Pause, Play, Trash2, Radio } from 'lucide-react';
import { LevelBadge, ServiceBadge, TimeStamp } from './LogHelpers';
import { useRealtimeLogs } from '../../hooks/useRealtimeLogs';
import { LogLevel } from '../../types';

interface Props {
  serviceFilter?: string;
  levelFilter?: LogLevel;
}

export const LiveStream: React.FC<Props> = ({ serviceFilter, levelFilter }) => {
  const { logs, isConnected, isPaused, togglePause, clearLogs } = useRealtimeLogs({
    service: serviceFilter,
    level: levelFilter,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (!isPaused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Radio size={15} className={isConnected ? 'text-green-400' : 'text-slate-500'} />
          <span className="text-sm font-medium text-slate-200">Live Stream</span>
          {isConnected && !isPaused && <span className="live-dot" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{logs.length} events</span>
          <button
            onClick={togglePause}
            className={`btn-ghost text-xs flex items-center gap-1.5 ${isPaused ? 'text-green-400' : 'text-yellow-400'}`}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={clearLogs} className="btn-ghost text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300">
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Log stream */}
      <div className="flex-1 overflow-y-auto font-mono text-xs bg-slate-950 p-4 space-y-1 min-h-0">
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-600">
            {isConnected ? 'Waiting for logs...' : 'Connecting...'}
          </div>
        )}
        {logs.map((log, i) => (
          <div
            key={`${log.id}-${i}`}
            className={`flex items-start gap-3 py-1 px-2 rounded hover:bg-slate-900 transition-colors log-row-${log.level}`}
          >
            <TimeStamp ts={log.timestamp} />
            <ServiceBadge service={log.service} />
            <LevelBadge level={log.level} />
            <span className="text-slate-300 flex-1 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {isPaused && (
        <div className="text-center py-2 text-xs text-yellow-400 bg-yellow-500/10 border-t border-yellow-500/20">
          ⏸ Stream paused – new logs are buffered
        </div>
      )}
    </div>
  );
};
