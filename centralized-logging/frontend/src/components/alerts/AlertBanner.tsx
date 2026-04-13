import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  alerts: Alert[];
  onDismiss: () => void;
}

export const AlertBanner: React.FC<Props> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
        >
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-300">{alert.message}</p>
            <p className="text-xs text-red-400/70 mt-0.5">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </p>
          </div>
          <button onClick={onDismiss} className="text-red-400 hover:text-red-200 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
