import React from 'react';
import { motion } from 'framer-motion';
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
import { GlassBadge, GlassSurface } from '../glass';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'cyan' | 'success' | 'warning';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'processes', label: 'Processes', icon: Layers },
  { id: 'hardware', label: 'Hardware', icon: Cpu },
  { id: 'network', label: 'Network', icon: Wifi, badge: 'Live', badgeVariant: 'cyan' },
  { id: 'services', label: 'Services', icon: Cog },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'security', label: 'Security Center', icon: ShieldAlert, badge: 'Active', badgeVariant: 'success' },
  { id: 'events', label: 'Event Viewer', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileDown },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppStore();

  return (
    <aside className="w-56 h-full bg-[var(--glass-surface-subtle)] backdrop-blur-2xl backdrop-saturate-180 border-r border-[var(--glass-border)] flex flex-col justify-between py-3.5 px-2.5 select-none relative z-20 shadow-[var(--glass-specular)]">
      <div className="space-y-1">
        <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
          Workstation Modules
        </div>

        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors duration-150 group relative cursor-pointer ${
                  isActive
                    ? 'text-cyan-400 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {/* Active Floating Liquid Glass Pill */}
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/10 border border-cyan-400/25 shadow-sm shadow-cyan-500/10 -z-10"
                  >
                    <div
                      className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                      aria-hidden="true"
                    />
                  </motion.div>
                )}

                <div className="flex items-center gap-2.5 z-10">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-cyan-400'
                        : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <div className="z-10">
                    <GlassBadge
                      variant={item.badgeVariant || 'default'}
                      size="sm"
                    >
                      {item.badge}
                    </GlassBadge>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Glass Surface */}
      <GlassSurface
        elevation="subtle"
        blur="sm"
        rounded="xl"
        className="p-3 text-[11px] font-mono"
      >
        <div className="flex justify-between items-center text-[var(--text-secondary)]">
          <span>Engine</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
        <div className="text-[10px] mt-1 text-[var(--text-tertiary)] flex justify-between items-center">
          <span>Native FFI</span>
          <span className="text-[var(--text-secondary)]">Koffi v3.3</span>
        </div>
      </GlassSurface>
    </aside>
  );
};
