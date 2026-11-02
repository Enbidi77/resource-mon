import React, { useEffect } from 'react';
import { useAppStore, AppPage } from '../stores/useAppStore';
import { useMetricsStore } from '../stores/useMetricsStore';
import { TitleBar } from '../components/layout/TitleBar';
import { Sidebar } from '../components/layout/Sidebar';
import { StatusBar } from '../components/layout/StatusBar';
import { RightDrawer } from '../components/layout/RightDrawer';
import { CommandPalette } from '../components/common/CommandPalette';
import { GlassSurface } from '../components/glass';

import { DashboardPage } from '../pages/DashboardPage';
import { PerformancePage } from '../pages/PerformancePage';
import { ProcessesPage } from '../pages/ProcessesPage';
import { HardwarePage } from '../pages/HardwarePage';
import { NetworkPage } from '../pages/NetworkPage';
import { ServicesPage } from '../pages/ServicesPage';
import { StoragePage } from '../pages/StoragePage';
import { SecurityPage } from '../pages/SecurityPage';
import { EventsPage } from '../pages/EventsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const App: React.FC = () => {
  const { currentPage, setOverview, toasts, removeToast, theme } = useAppStore();
  const { setCurrentMetrics } = useMetricsStore();

  useEffect(() => {
    // Ensure document theme attribute is synced
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute('data-theme', theme);
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
      case 'overview':
        return <DashboardPage />;
      case 'performance':
        return <PerformancePage />;
      case 'processes':
        return <ProcessesPage />;
      case 'hardware':
        return <HardwarePage />;
      case 'network':
        return <NetworkPage />;
      case 'services':
        return <ServicesPage />;
      case 'storage':
        return <StoragePage />;
      case 'security':
        return <SecurityPage />;
      case 'events':
        return <EventsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--glass-bg-canvas)] text-[var(--text-primary)] overflow-hidden font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Liquid Glass Ambient Lighting Canvas (subtle background refraction layers) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 dark:bg-cyan-500/[0.08] light:bg-cyan-500/[0.12] blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/[0.07] light:bg-indigo-400/[0.12] blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-[36rem] h-[36rem] rounded-full bg-purple-500/10 dark:bg-purple-600/[0.06] light:bg-purple-400/[0.10] blur-[130px]" />
      </div>

      {/* Floating Apple Glass Titlebar */}
      <TitleBar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
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
                toast.type === 'success'
                  ? 'border-emerald-500/30 text-emerald-400'
                  : toast.type === 'error'
                  ? 'border-red-500/30 text-red-400'
                  : toast.type === 'warning'
                  ? 'border-amber-500/30 text-amber-400'
                  : 'border-[var(--glass-border)] text-[var(--text-primary)]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  toast.type === 'success'
                    ? 'bg-emerald-400'
                    : toast.type === 'error'
                    ? 'bg-red-400'
                    : toast.type === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
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
