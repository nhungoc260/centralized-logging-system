import React, { useState } from 'react';
import { X, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Log } from '../../types';
import { LevelBadge, ServiceBadge, TimeStamp } from './LogHelpers';
import { format } from 'date-fns';

// ─── Modal chi tiết log ────────────────────────────────────────────────────
const LogDetailModal: React.FC<{ log: Log; onClose: () => void }> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyMessage = () => {
    navigator.clipboard.writeText(log.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Đóng modal khi click ngoài
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <LevelBadge level={log.level} />
            <ServiceBadge service={log.service} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              Copy JSON
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</p>
              <button onClick={copyMessage} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                <Copy size={11} /> Copy
              </button>
            </div>
            <p className="text-sm text-slate-200 font-mono bg-slate-950 p-3 rounded-lg leading-relaxed break-all">
              {log.message}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Timestamp" value={format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')} />
            <InfoField label="Level" value={log.level.toUpperCase()} valueClass={
              log.level === 'error' ? 'text-red-400' :
              log.level === 'warn' ? 'text-yellow-400' :
              log.level === 'info' ? 'text-blue-400' : 'text-purple-400'
            } />
            <InfoField label="Service" value={log.service} />
            {log.traceId && <InfoField label="Trace ID" value={log.traceId} valueClass="text-blue-400" />}
            {log.id && <InfoField label="Log ID" value={log.id} valueClass="text-slate-500 text-xs" />}
          </div>

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Metadata</p>
              <pre className="text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-lg overflow-x-auto leading-relaxed">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoField: React.FC<{ label: string; value: string; valueClass?: string }> = ({
  label, value, valueClass = 'text-slate-200'
}) => (
  <div className="bg-slate-950/50 rounded-lg p-3">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className={`text-xs font-mono break-all ${valueClass}`}>{value}</p>
  </div>
);

// ─── Row trong bảng ────────────────────────────────────────────────────────
const LogRow: React.FC<{ log: Log; onOpenDetail: (log: Log) => void }> = ({ log, onOpenDetail }) => {
  return (
    <tr
      className={`border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors log-row-${log.level} group`}
      onClick={() => onOpenDetail(log)}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <TimeStamp ts={log.timestamp} />
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <ServiceBadge service={log.service} />
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <LevelBadge level={log.level} />
      </td>
      <td className="px-3 py-3 text-sm text-slate-300 font-mono max-w-xl">
        <span className="truncate block max-w-lg">{log.message}</span>
      </td>
      <td className="px-3 py-3 w-8">
        <ExternalLink size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </td>
    </tr>
  );
};

// ─── Bảng chính ───────────────────────────────────────────────────────────
interface Props {
  logs: Log[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (p: number) => void;
}

export const LogTable: React.FC<Props> = ({ logs, total, page, totalPages, isLoading, onPageChange }) => {
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <>
      {/* Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-200">Log Entries</h2>
          <span className="text-xs text-slate-500">{total.toLocaleString()} results • click any row to view details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Level</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Message</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500">
                    No logs found matching your filters
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <LogRow
                    key={log.id || log.createdAt}
                    log={log}
                    onOpenDetail={setSelectedLog}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 text-xs"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      p === page ? 'bg-blue-600 text-white' : 'btn-ghost'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
