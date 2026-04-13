import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { LiveStream } from '../components/logs/LiveStream';
import { useServices } from '../hooks/useLogs';
import { LogLevel } from '../types';

const LEVELS: LogLevel[] = ['info', 'warn', 'error', 'debug'];

export const LivePage: React.FC = () => {
  const { data: services = [] } = useServices();
  const [service, setService] = useState<string>('');
  const [level, setLevel] = useState<string>('');

  return (
    <Layout title="Live Stream" subtitle="Real-time log feed via WebSocket">
      <div className="flex flex-col gap-4 h-full" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Quick filters */}
        <div className="flex gap-3">
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="input-field"
          >
            <option value="">All Services</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="input-field"
          >
            <option value="">All Levels</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>

        {/* Stream */}
        <div className="flex-1 min-h-0">
          <LiveStream
            serviceFilter={service || undefined}
            levelFilter={level as LogLevel || undefined}
          />
        </div>
      </div>
    </Layout>
  );
};
