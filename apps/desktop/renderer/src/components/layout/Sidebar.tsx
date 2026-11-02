import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Layers,
  Cpu,
  Wifi,
  Cog,
  HardDrive,
  ShieldAlert,
  FileText,
  FileDown,
  Settings,
} from 'lucide-react';
import { useAppStore, AppPage } from '../../stores/useAppStore';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'processes', label: 'Processes', icon: Layers },
  { id: 'hardware', label: 'Hardware', icon: Cpu },
  { id: 'network', label: 'Network', icon: Wifi, badge: 'Live' },
  { id: 'services', label: 'Services', icon: Cog },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'security', label: 'Security Center', icon: ShieldAlert, badge: 'Active' },
  { id: 'events', label: 'Event Viewer', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileDown },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppStore();

  return (
    <aside className="w-56 h-full bg-[#0d1017]/80 backdrop-blur-xl border-r border-white/[0.08] flex flex-col justify-between py-3 px-2 select-none">
      <div className="space-y-1">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
          Workstation Modules
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 border border-white/5'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 bg-slate-900/40 rounded-lg border border-white/5 text-[11px] text-slate-500 font-mono">
        <div className="flex justify-between items-center text-slate-400">
          <span>Engine</span>
          <span className="text-emerald-400 font-semibold">Active</span>
        </div>
        <div className="text-[10px] mt-0.5 text-slate-500">Koffi Win32 FFI v3.3</div>
      </div>
    </aside>
  );
};
