import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ScrollText, Bell, Settings, LogOut,
  Activity, Server, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Nav items cho developer
const devNavItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logs',     icon: ScrollText,      label: 'Logs Explorer' },
  { to: '/live',     icon: Activity,        label: 'Live Stream' },
  { to: '/alerts',   icon: Bell,            label: 'Alerts' },
  { to: '/services', icon: Server,          label: 'Services' },
];

// Nav items chỉ admin thấy thêm
const adminOnlyItems = [
  { to: '/admin',    icon: ShieldCheck,     label: 'Admin Panel' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = isAdmin ? [...devNavItems, ...adminOnlyItems] : devNavItems;

  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">LogCenter</p>
            <p className="text-xs text-slate-500">Monitoring System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : to === '/admin'
                    ? 'text-yellow-400/80 hover:text-yellow-300 hover:bg-yellow-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {to === '/admin' && !isActive && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                    ADMIN
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-blue-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Role badge */}
      <div className="px-4 py-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
          isAdmin
            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        }`}>
          {isAdmin ? <ShieldCheck size={13} /> : <Activity size={13} />}
          {isAdmin ? 'Administrator' : 'Developer'}
        </div>
      </div>

      {/* User footer */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-800 space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>

        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
            isAdmin
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
