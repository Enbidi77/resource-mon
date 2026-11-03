import React, { useEffect } from "react";
import { useAppStore, AppPage } from "../stores/useAppStore";
import { useMetricsStore } from "../stores/useMetricsStore";
import { TitleBar } from "../components/layout/TitleBar";
import { Sidebar } from "../components/layout/Sidebar";
import { StatusBar } from "../components/layout/StatusBar";
import { RightDrawer } from "../components/layout/RightDrawer";
import { CommandPalette } from "../components/common/CommandPalette";
import { GlassSurface } from "../components/glass";

import { DashboardPage } from "../pages/DashboardPage";
import { PerformancePage } from "../pages/PerformancePage";
import { ProcessesPage } from "../pages/ProcessesPage";
import { HardwarePage } from "../pages/HardwarePage";
import { NetworkPage } from "../pages/NetworkPage";
import { ServicesPage } from "../pages/ServicesPage";
import { StoragePage } from "../pages/StoragePage";
import { SecurityPage } from "../pages/SecurityPage";
import { EventsPage } from "../pages/EventsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SettingsPage } from "../pages/SettingsPage";

export const App: React.FC = () => {
  const { currentPage, setOverview, toasts, removeToast, theme } =
    useAppStore();
  const { setCurrentMetrics } = useMetricsStore();

  useEffect(() => {
    // Ensure document theme attribute is synced
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    // 1. Fetch static system overview
    if (window.sentinelAPI) {
      window.sentinelAPI.getSystemOverview().then((overview) => {
        if (overview) setOverview(overview);
      });

      // 2. Subscribe to real-time high frequency metric stream
      const unsubscribe = window.sentinelAPI.onSystemMetrics((snapshot) => {
        setCurrentMetrics(snapshot);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [setOverview, setCurrentMetrics]);

  const renderPage = (page: AppPage) => {
    switch (page) {
      case "overview":
        return <DashboardPage />;
      case "performance":
        return <PerformancePage />;
      case "processes":
        return <ProcessesPage />;
      case "hardware":
        return <HardwarePage />;
      case "network":
        return <NetworkPage />;
      case "services":
        return <ServicesPage />;
      case "storage":
        return <StoragePage />;
      case "security":
        return <SecurityPage />;
      case "events":
        return <EventsPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--glass-bg-canvas)] text-[var(--text-primary)] overflow-hidden font-sans relative selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200">
      {/* Liquid Glass Vibrant Ambient Mesh Gradient (Rich Contrast Refraction Backplane) */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
        aria-hidden="true"
      >
        {/* Dark cosmic gradient base mesh (Active only in dark mode) */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-tr from-[#060814] via-[#090d1f] to-[#0e071c] opacity-95" />

        {/* Light pastel ambient base mesh (Active only in light mode) */}
        <div className="block dark:hidden absolute inset-0 bg-gradient-to-tr from-[#eef2f8] via-[#f4f7fb] to-[#faf5fc]" />

        {/* Top-left vibrant cyan / sky bloom */}
        <div className="absolute -top-24 -left-20 w-[34rem] h-[34rem] rounded-full bg-cyan-400/20 dark:bg-cyan-500/25 blur-[140px]" />

        {/* Center / upper-right electric cobalt blue illumination */}
        <div className="absolute top-8 left-1/3 w-[40rem] h-[40rem] rounded-full bg-blue-400/18 dark:bg-blue-600/35 blur-[160px]" />

        {/* Center-right & middle vivid magenta / pink bloom */}
        <div className="absolute top-1/4 -right-16 w-[42rem] h-[42rem] rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-600/35 blur-[160px]" />

        {/* Bottom-right / center deep royal purple & rose glow */}
        <div className="absolute -bottom-24 right-1/4 w-[38rem] h-[38rem] rounded-full bg-purple-400/18 dark:bg-purple-600/30 blur-[150px]" />

        {/* Bottom-left / middle-left deep indigo & violet bloom */}
        <div className="absolute bottom-4 -left-12 w-[34rem] h-[34rem] rounded-full bg-indigo-400/18 dark:bg-indigo-600/30 blur-[140px]" />

        {/* Ethereal bottom-right jewel sparkle accent */}
        <div className="absolute bottom-12 right-12 opacity-30 dark:opacity-35 pointer-events-none">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 fill-slate-400 dark:fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
          </svg>
        </div>
      </div>

      {/* Floating Apple Glass Titlebar */}
      <TitleBar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Navigation Floating Glass Sidebar */}
        <Sidebar />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-hidden relative">
          {renderPage(currentPage)}
        </main>

        {/* Collapsible Deep Inspector Floating Sheet */}
        <RightDrawer />
      </div>

      {/* Apple Glass Workstation Status Bar */}
      <StatusBar />

      {/* Global Apple Glass Command Palette */}
      <CommandPalette />

      {/* Floating Apple Glass Toast Notifications */}
      <div className="fixed bottom-10 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto cursor-pointer"
          >
            <GlassSurface
              elevation="elevated"
              blur="lg"
              rounded="xl"
              className={`px-4 py-2.5 text-xs font-mono flex items-center gap-2.5 transition-all shadow-xl hover:scale-[1.02] ${
                toast.type === "success"
                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : toast.type === "error"
                    ? "border-red-500/30 text-red-600 dark:text-red-400"
                    : toast.type === "warning"
                      ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : "border-[var(--glass-border)] text-[var(--text-primary)]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  toast.type === "success"
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : toast.type === "error"
                      ? "bg-red-500 dark:bg-red-400"
                      : toast.type === "warning"
                        ? "bg-amber-500 dark:bg-amber-400"
                        : "bg-cyan-500 dark:bg-cyan-400"
                }`}
              />
              <span>{toast.message}</span>
            </GlassSurface>
          </div>
        ))}
      </div>
    </div>
  );
};
