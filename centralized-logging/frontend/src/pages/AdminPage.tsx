import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useQueueStats } from '../hooks/useLogs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  ShieldCheck, Users, Trash2, Activity, Settings2,
  Loader2, UserPlus, X, Eye, EyeOff, CheckCircle,
  AlertTriangle, RefreshCw, Database, UserCog, ChevronDown, Pencil, Save
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

type Tab = 'users' | 'logs' | 'queue' | 'threshold' | 'profile';

// ─── Toast ────────────────────────────────────────────────────────────────
const Toast: React.FC<{ msg: { type: 'ok' | 'err'; text: string } | null; onClose: () => void }> = ({ msg, onClose }) => {
  React.useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-pulse-once ${
      msg.type === 'ok'
        ? 'bg-green-500/10 border-green-500/30 text-green-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      {msg.type === 'ok' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
      <span className="flex-1">{msg.text}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
};

// ─── Tab: Users ───────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'developer' });
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<{ id: string; name: string } | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/auth/users')).data.data,
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/auth/register', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMsg({ type: 'ok', text: `User "${form.email}" created successfully!` });
      setForm({ email: '', name: '', password: '', role: 'developer' });
      setShowForm(false);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Failed to create user' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMsg({ type: 'ok', text: 'User deleted successfully.' });
    },
    onError: () => setMsg({ type: 'err', text: 'Cannot delete this user.' }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/auth/users/${id}/role`, { role }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMsg({ type: 'ok', text: `Role updated to "${vars.role}".` });
      setRoleDropdown(null);
    },
    onError: () => setMsg({ type: 'err', text: 'Failed to update role.' }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/auth/users/${id}/profile`, { name }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMsg({ type: 'ok', text: `Name updated to "${vars.name}".` });
      setEditUser(null);
    },
    onError: () => setMsg({ type: 'err', text: 'Failed to update name.' }),
  });

  return (
    <div className="space-y-4">
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{users.length} user(s) total</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-xs">
          <UserPlus size={14} />
          Add User
        </button>
      </div>

      {/* Form thêm user */}
      {showForm && (
        <div className="card p-5 border border-blue-500/30 bg-blue-500/5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <UserPlus size={14} className="text-blue-400" /> New User
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Full Name *</label>
              <input className="input-field w-full" placeholder="John Doe"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email *</label>
              <input className="input-field w-full" placeholder="john@example.com" type="email"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Password * (min 6)</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field w-full pr-9"
                  placeholder="••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Role</label>
              <select className="input-field w-full" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.email || !form.name || !form.password}
              className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50">
              {addMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Create User
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-blue-400" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        u.role === 'admin' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>{u.name?.[0]?.toUpperCase()}</div>
                      {editUser?.id === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            autoFocus
                            className="input-field py-1 px-2 text-sm w-36"
                            value={editUser.name}
                            onChange={e => setEditUser({ id: u.id, name: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') renameMutation.mutate({ id: u.id, name: editUser.name });
                              if (e.key === 'Escape') setEditUser(null);
                            }}
                          />
                          <button onClick={() => renameMutation.mutate({ id: u.id, name: editUser.name })}
                            className="text-green-400 hover:text-green-300 p-0.5" title="Save">
                            <Save size={13} />
                          </button>
                          <button onClick={() => setEditUser(null)}
                            className="text-slate-500 hover:text-slate-300 p-0.5" title="Cancel">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <span className="text-slate-200 text-sm">{u.name}</span>
                          {u.id === me?.id && (
                            <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">you</span>
                          )}
                          <button
                            onClick={() => setEditUser({ id: u.id, name: u.name })}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-blue-400 transition-all p-0.5"
                            title="Edit name"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.id === me?.id ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-400">{u.role}</span>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setRoleDropdown(roleDropdown === u.id ? null : u.id)}
                          className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium transition-colors hover:opacity-80 ${
                            u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {u.role}
                          <ChevronDown size={11} />
                        </button>
                        {roleDropdown === u.id && (
                          <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                            {['admin', 'developer'].filter(r => r !== u.role).map(r => (
                              <button key={r} onClick={() => roleMutation.mutate({ id: u.id, role: r })}
                                className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-700 text-slate-300 capitalize">
                                Set as {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me?.id && (
                      <button
                        onClick={() => { if (window.confirm(`Delete "${u.name}"?`)) deleteMutation.mutate(u.id); }}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1" title="Delete user">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Edit Profile ────────────────────────────────────────────────────
const ProfileTab: React.FC = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const nameMutation = useMutation({
    mutationFn: () => api.patch(`/auth/users/${user?.id}/profile`, { name }),
    onSuccess: () => setMsg({ type: 'ok', text: 'Name updated! Re-login to see changes.' }),
    onError: () => setMsg({ type: 'err', text: 'Failed to update name.' }),
  });

  const pwMutation = useMutation({
    mutationFn: () => api.patch(`/auth/users/${user?.id}/password`, { currentPassword: currentPw, newPassword: newPw }),
    onSuccess: async () => {
      setMsg({ type: 'ok', text: 'Password changed! Logging you back in...' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      // Re-login with new password
      if (user?.email) {
        try { await login(user.email, newPw); } catch { /* ignore */ }
      }
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setMsg({ type: 'err', text: err?.response?.data?.message || 'Failed to change password.' });
    },
  });

  const handleChangePw = () => {
    if (newPw !== confirmPw) { setMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6) { setMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); return; }
    pwMutation.mutate();
  };

  return (
    <div className="space-y-5 max-w-md">
      <Toast msg={msg} onClose={() => setMsg(null)} />

      {/* Update name */}
      <div className="card p-5">
        <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <UserCog size={14} className="text-blue-400" /> Update Display Name
        </h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Full Name</label>
            <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
            <input className="input-field w-full bg-slate-900 cursor-not-allowed opacity-60" value={user?.email || ''} disabled />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
          </div>
          <button onClick={() => nameMutation.mutate()}
            disabled={nameMutation.isPending || !name.trim() || name === user?.name}
            className="btn-primary text-xs flex items-center gap-2 disabled:opacity-50">
            {nameMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            Save Name
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Settings2 size={14} className="text-yellow-400" /> Change Password
        </h4>
        <div className="space-y-3">
          {[
            { label: 'Current Password', val: currentPw, set: setCurrentPw },
            { label: 'New Password (min 6)', val: newPw, set: setNewPw },
            { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-xs text-slate-500 mb-1.5 block">{label}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field w-full pr-9"
                  placeholder="••••••" value={val} onChange={e => set(e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setShowPw(s => !s)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPw ? 'Hide' : 'Show'} passwords
          </button>
          <button onClick={handleChangePw}
            disabled={pwMutation.isPending || !currentPw || !newPw || !confirmPw}
            className="btn-primary text-xs flex items-center gap-2 disabled:opacity-50">
            {pwMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Xóa Logs ────────────────────────────────────────────────────────
const LogsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [service, setService] = useState('');
  const [level, setLevel] = useState('');
  const [before, setBefore] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const { data: services = [] } = useQuery<string[]>({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/logs/services')).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const params: Record<string, string> = {};
      if (service) params.service = service;
      if (level) params.level = level;
      if (before) params.before = new Date(before).toISOString();
      return (await api.delete('/logs', { params })).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['log-stats'] });
      setMsg({ type: 'ok', text: `Deleted ${data.data?.deletedCount ?? 0} log(s) successfully.` });
    },
    onError: () => setMsg({ type: 'err', text: 'Failed to delete logs.' }),
  });

  const handleDelete = () => {
    const conditions: string[] = [];
    if (service) conditions.push(`service = ${service}`);
    if (level) conditions.push(`level = ${level.toUpperCase()}`);
    if (before) conditions.push(`before ${before}`);
    const desc = conditions.length ? conditions.join(', ') : 'ALL logs';
    if (window.confirm(`⚠️ Delete ${desc}?\n\nThis cannot be undone!`)) deleteMutation.mutate();
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Toast msg={msg} onClose={() => setMsg(null)} />
      <div className="card p-5 border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-red-400" />
          <h4 className="text-sm font-semibold text-red-300">Delete Logs</h4>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Leave all filters empty to delete <strong className="text-red-400">ALL logs</strong>. Irreversible.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Filter by Service</label>
            <select className="input-field w-full" value={service} onChange={e => setService(e.target.value)}>
              <option value="">All services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Filter by Level</label>
            <select className="input-field w-full" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="">All levels</option>
              {['info','warn','error','debug'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Delete logs before</label>
            <input type="datetime-local" className="input-field w-full" value={before} onChange={e => setBefore(e.target.value)} />
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleteMutation.isPending}
          className="mt-5 flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete Matching Logs
        </button>
      </div>
    </div>
  );
};

// ─── Tab: Queue Stats ─────────────────────────────────────────────────────
const QueueTab: React.FC = () => {
  const { data: stats, isLoading, refetch, isFetching } = useQueueStats();
  const COLORS: Record<string, string> = {
    waiting: 'text-yellow-400', active: 'text-blue-400',
    completed: 'text-green-400', failed: 'text-red-400', delayed: 'text-purple-400',
  };
  const ICONS: Record<string, string> = {
    waiting: '⏳', active: '⚡', completed: '✅', failed: '❌', delayed: '🕒',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">BullMQ — log-processing queue</p>
        <button onClick={() => refetch()} disabled={isFetching}
          className="btn-ghost text-xs flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-blue-400" /></div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(stats as Record<string, number>).map(([key, val]) => (
            <div key={key} className="card p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 capitalize">{key}</p>
                <span className="text-base">{ICONS[key] || '📊'}</span>
              </div>
              <p className={`text-3xl font-bold ${COLORS[key] || 'text-slate-200'}`}>{val}</p>
              <p className="text-xs text-slate-600 mt-1">jobs</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">No queue data available</p>
      )}
    </div>
  );
};

// ─── Tab: Alert Threshold ─────────────────────────────────────────────────
const ThresholdTab: React.FC = () => {
  const [threshold, setThreshold] = useState(
    () => localStorage.getItem('alert_threshold') || '50'
  );
  const [windowSec, setWindowSec] = useState(
    () => localStorage.getItem('alert_window') || '60'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('alert_threshold', threshold);
    localStorage.setItem('alert_window', windowSec);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const presets = [
    { label: 'Strict', threshold: '10', window: '60' },
    { label: 'Normal', threshold: '50', window: '60' },
    { label: 'Relaxed', threshold: '100', window: '120' },
  ];

  return (
    <div className="space-y-4 max-w-md">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Settings2 size={15} className="text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-200">Alert Threshold</h4>
        </div>

        {/* Presets */}
        <div className="flex gap-2 mb-5">
          {presets.map(p => (
            <button key={p.label} onClick={() => { setThreshold(p.threshold); setWindowSec(p.window); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                threshold === p.threshold && windowSec === p.window
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Error count threshold</label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={500} value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="flex-1 accent-blue-500" />
              <input type="number" min={1} max={1000} value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="input-field w-20 text-center font-bold" />
              <span className="text-xs text-slate-500 w-12">errors</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Time window</label>
            <div className="flex items-center gap-3">
              <input type="range" min={10} max={3600} step={10} value={windowSec}
                onChange={e => setWindowSec(e.target.value)}
                className="flex-1 accent-blue-500" />
              <input type="number" min={10} max={3600} value={windowSec}
                onChange={e => setWindowSec(e.target.value)}
                className="input-field w-20 text-center font-bold" />
              <span className="text-xs text-slate-500 w-12">seconds</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-800/60 rounded-xl p-4 text-sm text-center">
            Alert when{' '}
            <span className="text-red-400 font-bold text-lg mx-1">{threshold}</span>
            errors occur within{' '}
            <span className="text-blue-400 font-bold text-lg mx-1">{windowSec}s</span>
            {' '}per service
          </div>
        </div>

        <button onClick={handleSave}
          className={`mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
          {saved ? <CheckCircle size={14} /> : <Settings2 size={14} />}
          {saved ? 'Saved!' : 'Save Configuration'}
        </button>

        <p className="text-xs text-slate-600 mt-3 text-center">
          To apply to backend: update <code className="bg-slate-800 px-1 rounded">ERROR_THRESHOLD</code>{' '}
          and <code className="bg-slate-800 px-1 rounded">ERROR_WINDOW_SECONDS</code> in <code className="bg-slate-800 px-1 rounded">backend/.env</code>
        </p>
      </div>
    </div>
  );
};

// ─── Main AdminPage ───────────────────────────────────────────────────────
export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'users',     icon: <Users size={14} />,     label: 'Users' },
    { id: 'profile',   icon: <UserCog size={14} />,   label: 'My Profile' },
    { id: 'logs',      icon: <Database size={14} />,  label: 'Delete Logs' },
    { id: 'queue',     icon: <Activity size={14} />,  label: 'Queue Stats' },
    { id: 'threshold', icon: <Settings2 size={14} />, label: 'Alert Config' },
  ];

  return (
    <Layout title="Admin Panel" subtitle="System administration — admin only">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <ShieldCheck size={16} className="text-yellow-400" />
          <p className="text-sm text-yellow-300 font-medium">
            Logged in as <strong>{user?.name}</strong>
            <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-0.5 rounded-full">Administrator</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab === 'users'     && <UsersTab />}
          {tab === 'profile'   && <ProfileTab />}
          {tab === 'logs'      && <LogsTab />}
          {tab === 'queue'     && <QueueTab />}
          {tab === 'threshold' && <ThresholdTab />}
        </div>
      </div>
    </Layout>
  );
};