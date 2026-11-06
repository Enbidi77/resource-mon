import React from "react";
import { motion } from "framer-motion";
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
  Pin,
} from "lucide-react";
import { useAppStore, AppPage } from "../../stores/useAppStore";

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "cyan" | "success" | "warning";
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "performance", label: "Performance", icon: Activity },
  { id: "processes", label: "Processes", icon: Layers },
  { id: "hardware", label: "Hardware", icon: Cpu },
  {
    id: "network",
    label: "Network",
    icon: Wifi,
    badge: "Live",
    badgeVariant: "cyan",
  },
  { id: "services", label: "Services", icon: Cog },
  { id: "storage", label: "Storage", icon: HardDrive },
  {
    id: "security",
    label: "Security Center",
    icon: ShieldAlert,
    badge: "Active",
    badgeVariant: "success",
  },
  { id: "events", label: "Event Viewer", icon: FileText },
  { id: "reports", label: "Reports", icon: FileDown },
  {
    id: "compact",
    label: "Compact HUD",
    icon: Pin,
    badge: "AOT",
    badgeVariant: "cyan",
  },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppStore();

  return (
    <aside className="w-58 h-full bg-white/70 dark:bg-black/25 backdrop-blur-3xl backdrop-saturate-200 border-r border-black/[0.08] dark:border-white/10 flex flex-col justify-between py-4 px-3 select-none relative z-20 shadow-sm dark:shadow-2xl">
      <div className="space-y-1">
        <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 font-mono">
          Workstation Modules
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-150 group relative cursor-pointer ${
                  isActive
                    ? "text-cyan-900 dark:text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.04]"
                }`}
              >
                {/* Active Luminous Apple Glass Pill */}
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 dark:from-cyan-500/25 dark:via-blue-600/20 dark:to-purple-600/30 border border-cyan-500/35 dark:border-cyan-400/50 shadow-sm dark:shadow-[0_0_16px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] -z-10"
                  >
                    <div
                      className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 dark:via-cyan-300/60 to-transparent"
                      aria-hidden="true"
                    />
                  </motion.div>
                )}

                <div className="flex items-center gap-2.5 z-10">
                  <Icon
                    className={`w-4 h-4 transition-all duration-150 ${
                      isActive
                        ? "text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                        : "text-slate-400 group-hover:text-slate-700 dark:text-white/40 dark:group-hover:text-white/80"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <div className="z-10">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-medium border backdrop-blur-md transition-all ${
                        item.badgeVariant === "cyan"
                          ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-400/40 shadow-sm dark:shadow-[0_0_8px_rgba(34,211,238,0.35)]"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/40 shadow-sm dark:shadow-[0_0_8px_rgba(52,211,153,0.35)]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Frosted Glass Pod */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-xl p-3 shadow-sm dark:shadow-lg dark:shadow-black/20 text-[11px] font-mono">
        <div className="flex justify-between items-center text-slate-600 dark:text-white/60">
          <span>Engine</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
        <div className="text-[10px] mt-1 text-slate-400 dark:text-white/40 flex justify-between items-center">
          <span>Native FFI</span>
          <span className="text-slate-700 dark:text-white/80 font-medium">
            Koffi v3.3
          </span>
        </div>
      </div>
    </aside>
  );
};
