import React, { useEffect, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore, AppPage } from "../stores/useAppStore";
import { useMetricsStore } from "../stores/useMetricsStore";
import { TitleBar } from "../components/layout/TitleBar";
import { Sidebar } from "../components/layout/Sidebar";
import { StatusBar } from "../components/layout/StatusBar";
import { RightDrawer } from "../components/layout/RightDrawer";
import { CommandPalette } from "../components/common/CommandPalette";
import { GlassSurface, PageLoadingSkeleton } from "../components/glass";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { CompactHUD } from "../components/compact/CompactHUD";

// Lazy-loaded workstation page modules for fast zero-lag code splitting
const DashboardPage = lazy(() =>
  import("../pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const PerformancePage = lazy(() =>
  import("../pages/PerformancePage").then((m) => ({
    default: m.PerformancePage,
  })),
);
const ProcessesPage = lazy(() =>
  import("../pages/ProcessesPage").then((m) => ({ default: m.ProcessesPage })),
);
const HardwarePage = lazy(() =>
  import("../pages/HardwarePage").then((m) => ({ default: m.HardwarePage })),
);
const NetworkPage = lazy(() =>
  import("../pages/NetworkPage").then((m) => ({ default: m.NetworkPage })),
);
const ServicesPage = lazy(() =>
  import("../pages/ServicesPage").then((m) => ({ default: m.ServicesPage })),
);
const StoragePage = lazy(() =>
  import("../pages/StoragePage").then((m) => ({ default: m.StoragePage })),
);
const SecurityPage = lazy(() =>
  import("../pages/SecurityPage").then((m) => ({ default: m.SecurityPage })),
);
const EventsPage = lazy(() =>
  import("../pages/EventsPage").then((m) => ({ default: m.EventsPage })),
);
const ReportsPage = lazy(() =>
  import("../pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const CompactPage = lazy(() =>
  import("../pages/CompactPage").then((m) => ({ default: m.CompactPage })),
);

export const App: React.FC = () => {
  const {
    currentPage,
    setOverview,
    toasts,
    removeToast,
    theme,
    isMaximized,
    setIsMaximized,
  } = useAppStore();
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
    // Synchronize theme across windows via Electron IPC
    if (window.sentinelAPI?.getTheme) {
      window.sentinelAPI.getTheme().then((mainTheme) => {
        if (mainTheme && mainTheme !== useAppStore.getState().theme) {
          useAppStore.getState().setThemeFromRemote(mainTheme);
        }
      });
    }

    const unsubTheme = window.sentinelAPI?.onThemeChanged
      ? window.sentinelAPI.onThemeChanged((nextTheme) => {
          useAppStore.getState().setThemeFromRemote(nextTheme);
        })
      : undefined;

    return () => {
      unsubTheme?.();
    };
  }, []);

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

      // 3. Keep window maximized state in sync with OS
      window.sentinelAPI.isWindowMaximized().then(setIsMaximized);
      const handleResize = () => {
        window.sentinelAPI?.isWindowMaximized().then(setIsMaximized);
      };
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          window.sentinelAPI?.trimMemory();
        }
      };
      window.addEventListener("resize", handleResize);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        unsubscribe();
        window.removeEventListener("resize", handleResize);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }
  }, [setOverview, setCurrentMetrics, setIsMaximized]);

  useEffect(() => {
    // Prefetch non-active page chunks in background during idle time
    const prefetchModules = () => {
      import("../pages/PerformancePage");
      import("../pages/ProcessesPage");
      import("../pages/HardwarePage");
      import("../pages/NetworkPage");
      import("../pages/ServicesPage");
      import("../pages/StoragePage");
      import("../pages/SecurityPage");
      import("../pages/EventsPage");
      import("../pages/ReportsPage");
      import("../pages/SettingsPage");
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (
        window as unknown as {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number },
          ) => number;
        }
      ).requestIdleCallback(prefetchModules, { timeout: 3000 });
      return () => {
        (
          window as unknown as { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(handle);
      };
    } else {
      const timer = setTimeout(prefetchModules, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

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
      case "compact":
        return <CompactPage />;
      default:
        return <DashboardPage />;
    }
  };

  const isStandaloneCompact =
    typeof window !== "undefined" &&
    (window.location.hash.includes("compact") ||
      window.location.search.includes("compact"));

  if (isStandaloneCompact) {
    return (
      <div className="h-screen w-screen bg-transparent overflow-hidden select-none">
        <CompactHUD standalone={true} />
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen flex flex-col bg-glass-canvas text-text-primary overflow-hidden font-sans relative selection:bg-cyan-500/30 selection:text-cyan-800 dark:selection:text-cyan-200 ${
        isMaximized
          ? "rounded-none border-none"
          : "rounded-[20px] border border-black/10 dark:border-white/15 shadow-[var(--glass-specular)]"
      }`}
    >
      {/* Liquid Glass Vibrant Ambient Mesh Gradient (Rich Contrast Refraction Backplane) */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
        aria-hidden="true"
      >
        {/* Dark cosmic gradient base mesh (Active only in dark mode) */}
        <div className="hidden dark:block absolute inset-0 bg-linear-to-tr from-[#060814] via-[#090d1f] to-[#0e071c] opacity-95" />

        {/* Light pastel ambient base mesh (Active only in light mode) */}
        <div className="block dark:hidden absolute inset-0 bg-linear-to-tr from-[#eef2f8] via-[#f4f7fb] to-[#faf5fc]" />

        {/* Top-left vibrant cyan / sky bloom */}
        <div className="absolute -top-24 -left-20 w-136 h-[34rem] rounded-full bg-cyan-400/20 dark:bg-cyan-500/25 blur-[140px]" />

        {/* Center / upper-right electric cobalt blue illumination */}
        <div className="absolute top-8 left-1/3 w-160 h-[40rem] rounded-full bg-blue-400/18 dark:bg-blue-600/35 blur-[160px]" />

        {/* Center-right & middle vivid magenta / pink bloom */}
        <div className="absolute top-1/4 -right-16 w-[42rem] h-168 rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-600/35 blur-[160px]" />

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
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full w-full overflow-hidden"
            >
              <ErrorBoundary fallbackTitle="Workstation Module Exception">
                <Suspense fallback={<PageLoadingSkeleton page={currentPage} />}>
                  {renderPage(currentPage)}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Collapsible Deep Inspector Floating Sheet */}
        <RightDrawer />
      </div>

      {/* Apple Glass Workstation Status Bar */}
      <StatusBar />

      {/* Global Apple Glass Command Palette */}
      <CommandPalette />

      {/* Toast Notification Container */}
      <div className="fixed bottom-12 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <GlassSurface
            key={toast.id}
            elevation="elevated"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl min-w-72 max-w-96 animate-in fade-in slide-in-from-bottom-5 duration-200 ${
              toast.type === "error"
                ? "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10"
                : toast.type === "warning"
                  ? "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                  : toast.type === "success"
                    ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                    : "border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10"
            }`}
          >
            <span className="text-xs font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </GlassSurface>
        ))}
      </div>
    </div>
  );
};
