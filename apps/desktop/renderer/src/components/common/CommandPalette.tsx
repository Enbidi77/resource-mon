import React, { useEffect, useState } from 'react';
import {
  Search,
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
  X,
} from 'lucide-react';
import { useAppStore, AppPage } from '../../stores/useAppStore';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setCurrentPage } = useAppStore();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    { label: 'Overview Dashboard', page: 'overview' as AppPage, icon: LayoutDashboard },
    { label: 'Performance Monitor (CPU, RAM, GPU)', page: 'performance' as AppPage, icon: Activity },
    { label: 'Process Explorer & Authenticode', page: 'processes' as AppPage, icon: Layers },
    { label: 'Hardware Inspector', page: 'hardware' as AppPage, icon: Cpu },
    { label: 'Network Monitor & Active Sockets', page: 'network' as AppPage, icon: Wifi },
    { label: 'Windows Services Manager', page: 'services' as AppPage, icon: Cog },
    { label: 'Storage & Drive Analytics', page: 'storage' as AppPage, icon: HardDrive },
    { label: 'Host Security Center & FIM', page: 'security' as AppPage, icon: ShieldAlert },
    { label: 'Windows Event Viewer', page: 'events' as AppPage, icon: FileText },
    { label: 'Generate System Audit Report', page: 'reports' as AppPage, icon: FileDown },
    { label: 'Workstation Settings', page: 'settings' as AppPage, icon: Settings },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24">
      <div className="w-[540px] bg-[#0e121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3 border-b border-white/10 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or module name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No matching commands</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setCurrentPage(item.page);
                    setIsCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-300 text-xs text-slate-300 text-left transition-colors group"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-3 py-2 bg-slate-900/60 border-t border-white/5 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};

