import React, { useEffect } from 'react';
import { useAppStore, AppPage } from '../stores/useAppStore';
import { useMetricsStore } from '../stores/useMetricsStore';
import { TitleBar } from '../components/layout/TitleBar';
import { Sidebar } from '../components/layout/Sidebar';
import { StatusBar } from '../components/layout/StatusBar';
import { RightDrawer } from '../components/layout/RightDrawer';
import { CommandPalette } from '../components/common/CommandPalette';

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
  const { currentPage, setOverview, toasts, removeToast } = useAppStore();
  const { setCurrentMetrics } = useMetricsStore();

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
    <div className="h-screen w-screen flex flex-col bg-[#080a0f] text-slate-100 overflow-hidden font-sans">
      {/* Frameless Workstation Titlebar */}
      <TitleBar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-hidden relative bg-[#090c13]/50">
          {renderPage(currentPage)}
        </main>

        {/* Collapsible Deep Inspector Drawer */}
        <RightDrawer />
      </div>

      {/* Workstation Status Bar */}
      <StatusBar />

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-10 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl border shadow-xl text-xs font-mono flex items-center gap-2 cursor-pointer transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-red-300'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-300'
                : 'bg-slate-900/90 border-white/10 text-slate-200'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

