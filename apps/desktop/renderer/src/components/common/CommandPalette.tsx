import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Pin,
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
    { label: 'Always-On-Top Compact HUD & Specs', page: 'compact' as AppPage, icon: Pin },
    { label: 'Workstation Settings', page: 'settings' as AppPage, icon: Settings },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4">
        {/* Floating Apple Liquid Glass Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="w-full max-w-[560px] rounded-2xl overflow-hidden relative bg-[var(--glass-surface-elevated)] backdrop-blur-2xl backdrop-saturate-200 border border-[var(--glass-border)] shadow-[var(--glass-shadow-elevated)] shadow-[var(--glass-specular-bright)]"
        >
          {/* Specular Rim */}
          <div
            className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Search Input Bar */}
          <div className="p-3.5 border-b border-[var(--glass-border-subtle)] flex items-center gap-3">
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search module or command..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none font-mono"
            />
            <button
              onClick={() => setIsCommandPaletteOpen(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-tertiary)] font-mono">
                No matching commands found
              </div>
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 text-xs text-[var(--text-secondary)] text-left transition-all duration-150 group cursor-pointer border border-transparent hover:border-cyan-500/20"
                  >
                    <Icon className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-cyan-400 transition-colors shrink-0" />
                    <span className="font-mono">{item.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
