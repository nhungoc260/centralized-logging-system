import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { LogStats } from '../../types';
import { format, parseISO } from 'date-fns';

const LEVEL_COLORS: Record<string, string> = {
  info:  '#3b82f6',
  warn:  '#f59e0b',
  error: '#ef4444',
  debug: '#8b5cf6',
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

interface Props {
  stats: LogStats;
}

// Timeline area chart - logs over time
export const TimelineChart: React.FC<Props> = ({ stats }) => {
  const data = stats.timeline.map((t) => ({
    time: format(parseISO(t._id), 'HH:mm'),
    total: t.count,
    errors: t.errors,
  }));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-medium text-slate-200">Log Volume (24h)</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTotal)" name="Total" />
            <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#colorErrors)" name="Errors" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Pie chart - distribution by level
export const LevelDistributionChart: React.FC<Props> = ({ stats }) => {
  const data = stats.byLevel.map((l) => ({
    name: l._id.toUpperCase(),
    value: l.count,
    color: LEVEL_COLORS[l._id] || '#64748b',
  }));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-medium text-slate-200">By Level</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Bar chart - top services
export const ServiceChart: React.FC<Props> = ({ stats }) => {
  const data = stats.byService.slice(0, 8).map((s, i) => ({
    name: s._id,
    count: s.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-medium text-slate-200">Top Services</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Logs">
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
