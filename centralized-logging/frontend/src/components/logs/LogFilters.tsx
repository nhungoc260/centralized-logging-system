import React from 'react';
import { Search, X } from 'lucide-react';
import { LogQueryParams } from '../../types';

interface Props {
  filters: LogQueryParams;
  services: string[];
  onChange: (f: Partial<LogQueryParams>) => void;
  onReset: () => void;
}

const LEVELS = ['info', 'warn', 'error', 'debug'];

export const LogFilters: React.FC<Props> = ({ filters, services, onChange, onReset }) => {
  const hasFilters = filters.service || filters.level || filters.search || filters.startTime || filters.endTime;

  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search messages..."
          value={filters.search || ''}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
          className="input-field w-full pl-8"
        />
      </div>

      {/* Service filter */}
      <select
        value={filters.service || ''}
        onChange={(e) => onChange({ service: e.target.value || undefined })}
        className="input-field"
      >
        <option value="">All Services</option>
        {services.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Level filter */}
      <select
        value={filters.level || ''}
        onChange={(e) => onChange({ level: e.target.value || undefined })}
        className="input-field"
      >
        <option value="">All Levels</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>{l.toUpperCase()}</option>
        ))}
      </select>

      {/* Start time */}
      <input
        type="datetime-local"
        value={filters.startTime?.slice(0, 16) || ''}
        onChange={(e) => onChange({ startTime: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        className="input-field text-xs"
        title="Start time"
      />

      {/* End time */}
      <input
        type="datetime-local"
        value={filters.endTime?.slice(0, 16) || ''}
        onChange={(e) => onChange({ endTime: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
        className="input-field text-xs"
        title="End time"
      />

      {/* Reset */}
      {hasFilters && (
        <button onClick={onReset} className="btn-ghost flex items-center gap-1.5 text-red-400 hover:text-red-300">
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
};
