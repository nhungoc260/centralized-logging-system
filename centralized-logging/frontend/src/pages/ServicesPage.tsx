import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useLogStats, useServices, useLogs } from '../hooks/useLogs';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Server, Loader2, ChevronRight, ArrowLeft,
  AlertTriangle, Info, Activity, TrendingUp
} from 'lucide-react';
import { LogTable } from '../components/logs/LogTable';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

// ── Service Detail Page ───────────────────────────────────────────────────
const ServiceDetail: React.FC<{ service: string; onBack: () => void }> = ({ service, onBack }) => {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState('');

  // Logs of this service
  const { data: logsData, isLoading: logsLoading } = useLogs({
    service, level: level || undefined, page, limit: 20,
  });

  // Stats of this service only
  const { data: stats } = useQuery({
    queryKey: ['service-stats', service],
    queryFn: async () => {
      const res = await api.get('/logs/stats', { params: { hours: 24, service } });
      return res.data.data;
    },
  });

  const errorCount = stats?.byLevel?.find((l: { _id: string }) => l._id === 'error')?.count || 0;
  const warnCount  = stats?.byLevel?.find((l: { _id: string }) => l._id === 'warn')?.count || 0;
  const infoCount  = stats?.byLevel?.find((l: { _id: string }) => l._id === 'info')?.count || 0;
  const totalCount = stats?.totalLogs || 0;
  const errorRate  = stats?.errorRate || 0;

  const timelineData = (stats?.timeline || []).map((t: { _id: string; count: number; errors: number }) => ({
    time: format(parseISO(t._id), 'HH:mm'),
    total: t.count,
    errors: t.errors,
  }));

  const pieData = (stats?.byLevel || []).map((l: { _id: string; count: number }) => ({
    name: l._id.toUpperCase(),
    value: l.count,
  }));

  const PIE_COLORS: Record<string, string> = {
    INFO: '#3b82f6', WARN: '#f59e0b', ERROR: '#ef4444', DEBUG: '#8b5cf6',
  };

  const LEVELS = ['info', 'warn', 'error', 'debug'];

  return (
    <div className="space-y-5">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="btn-ghost flex items-center gap-1.5 text-sm">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Server size={15} className="text-blue-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-white font-mono">{service}</p>
            <p className="text-xs text-slate-500">Last 24 hours</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total Logs', value: totalCount.toLocaleString(), icon: <Activity size={15} className="text-blue-400" />, color: 'text-blue-400' },
          { label: 'Errors',     value: errorCount.toLocaleString(), icon: <AlertTriangle size={15} className="text-red-400" />, color: 'text-red-400' },
          { label: 'Warnings',   value: warnCount.toLocaleString(),  icon: <AlertTriangle size={15} className="text-yellow-400" />, color: 'text-yellow-400' },
          { label: 'Error Rate', value: `${errorRate.toFixed(1)}%`,  icon: <TrendingUp size={15} className="text-purple-400" />, color: errorRate > 10 ? 'text-red-400' : 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-medium text-slate-200">Log Volume (24h)</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="svcTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="svcErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#svcTotal)" name="Total" />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#svcErrors)" name="Errors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie by level */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium text-slate-200">By Level</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry: { name: string }, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[entry.name] || '#64748b'} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {pieData.map((d: { name: string; value: number }) => (
                <div key={d.name} className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[d.name] || '#64748b' }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Log table with level filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Filter by level:</span>
          <div className="flex gap-1">
            <button onClick={() => { setLevel(''); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!level ? 'bg-blue-600 text-white' : 'btn-ghost'}`}>
              All
            </button>
            {LEVELS.map(l => (
              <button key={l} onClick={() => { setLevel(l); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${level === l ? 'bg-blue-600 text-white' : 'btn-ghost'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <LogTable
          logs={logsData?.logs || []}
          total={logsData?.total || 0}
          page={page}
          totalPages={logsData?.totalPages || 1}
          isLoading={logsLoading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

// ── Services List ─────────────────────────────────────────────────────────
export const ServicesPage: React.FC = () => {
  const { data: stats, isLoading } = useLogStats(24);
  const { data: services = [] } = useServices();
  const [selected, setSelected] = useState<string | null>(null);

  // If a service is selected, show detail view
  if (selected) {
    return (
      <Layout title={selected} subtitle="Service detail — last 24 hours">
        <ServiceDetail service={selected} onBack={() => setSelected(null)} />
      </Layout>
    );
  }

  return (
    <Layout title="Services" subtitle="Click a service to view details">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => {
            const svcStats  = stats?.byService.find(s => s._id === service);
            const count     = svcStats?.count || 0;
            const errCount  = stats?.byLevel?.find((l: { _id: string }) => l._id === 'error')?.count || 0;
            const errRate   = count > 0 ? ((errCount / count) * 100).toFixed(1) : '0.0';
            const isHighErr = parseFloat(errRate) > 10;

            return (
              <button
                key={service}
                onClick={() => setSelected(service)}
                className="card p-5 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Server size={15} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 font-mono">{service}</p>
                      <p className="text-xs text-slate-500">Last 24 hours</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{count.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-0.5">total log entries</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                    isHighErr
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    {isHighErr ? <AlertTriangle size={11} /> : <Info size={11} />}
                    {errRate}% errors
                  </div>
                </div>
              </button>
            );
          })}
          {services.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-500">
              No services have sent logs yet
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};