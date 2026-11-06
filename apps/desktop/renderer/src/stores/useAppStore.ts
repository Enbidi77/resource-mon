import { create } from "zustand";
import type {
  SystemOverview,
  ProcessInfo,
  NetworkConnection,
  SecurityAlert,
} from "@sentinel/contracts";

export type AppPage =
  | "overview"
  | "performance"
  | "processes"
  | "hardware"
  | "network"
  | "services"
  | "storage"
  | "security"
  | "events"
  | "reports"
  | "settings"
  | "compact";

export type AppTheme = "dark" | "light";

interface ToastNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

interface AppState {
  currentPage: AppPage;
  theme: AppTheme;
  isMaximized: boolean;
  overview: SystemOverview | null;
  selectedProcess: ProcessInfo | null;
  selectedConnection: NetworkConnection | null;
  selectedAlert: SecurityAlert | null;
  isRightDrawerOpen: boolean;
  isCommandPaletteOpen: boolean;
  searchQuery: string;
  toasts: ToastNotification[];

  setCurrentPage: (page: AppPage) => void;
  setTheme: (theme: AppTheme) => void;
  setThemeFromRemote: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setIsMaximized: (max: boolean) => void;
  setOverview: (overview: SystemOverview) => void;
  setSelectedProcess: (proc: ProcessInfo | null) => void;
  setSelectedConnection: (conn: NetworkConnection | null) => void;
  setSelectedAlert: (alert: SecurityAlert | null) => void;
  setIsRightDrawerOpen: (open: boolean) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addToast: (toast: Omit<ToastNotification, "id">) => void;
  removeToast: (id: string) => void;
}

const getInitialTheme = (): AppTheme => {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = window.localStorage.getItem("sentinel_theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  }
  return "dark";
};

const applyTheme = (theme: AppTheme) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "overview",
  theme: initialTheme,
  isMaximized: false,
  overview: null,
  selectedProcess: null,
  selectedConnection: null,
  selectedAlert: null,
  isRightDrawerOpen: false,
  isCommandPaletteOpen: false,
  searchQuery: "",
  toasts: [],

  setCurrentPage: (page) => set({ currentPage: page }),
  setTheme: (theme) => {
    if (get().theme === theme) return;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("sentinel_theme", theme);
    }
    applyTheme(theme);
    set({ theme });
    window.sentinelAPI?.setTheme(theme);
  },
  setThemeFromRemote: (theme) => {
    if (get().theme === theme) return;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("sentinel_theme", theme);
    }
    applyTheme(theme);
    set({ theme });
    // Intentionally omit window.sentinelAPI.setTheme to prevent echo back loop
  },
  toggleTheme: () => {
    const nextTheme: AppTheme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
  setIsMaximized: (isMaximized) => set({ isMaximized }),
  setOverview: (overview) => set({ overview }),
  setSelectedProcess: (proc) =>
    set({
      selectedProcess: proc,
      selectedConnection: null,
      selectedAlert: null,
      isRightDrawerOpen: Boolean(proc),
    }),
  setSelectedConnection: (conn) =>
    set({
      selectedConnection: conn,
      selectedProcess: null,
      selectedAlert: null,
      isRightDrawerOpen: Boolean(conn),
    }),
  setSelectedAlert: (alert) =>
    set({
      selectedAlert: alert,
      selectedProcess: null,
      selectedConnection: null,
      isRightDrawerOpen: Boolean(alert),
    }),
  setIsRightDrawerOpen: (open) => set({ isRightDrawerOpen: open }),
  setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
