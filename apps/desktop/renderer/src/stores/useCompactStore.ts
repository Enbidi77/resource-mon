import { create } from "zustand";
import {
  type CompactSettings,
  type CompactLayoutMode,
  type CompactDisplayDensity,
  type CompactVisualGauge,
  type CompactAccentColor,
  type CompactSpecId,
  type CompactSpecItemConfig,
  DEFAULT_COMPACT_SETTINGS,
  CompactSettingsSchema,
} from "@sentinel/contracts";

const STORAGE_KEY = "sentinel_compact_settings_v1";

function loadStoredSettings(): CompactSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_COMPACT_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPACT_SETTINGS;
    const parsed = JSON.parse(raw);
    const result = CompactSettingsSchema.safeParse(parsed);
    if (result.success) return result.data;
  } catch (e) {
    console.warn("Failed to load compact settings from storage, using defaults", e);
  }
  return DEFAULT_COMPACT_SETTINGS;
}

function saveStoredSettings(settings: CompactSettings): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to persist compact settings", e);
  }
}

interface CompactStoreState {
  settings: CompactSettings;
  isCustomizerOpen: boolean;

  setLayoutMode: (mode: CompactLayoutMode) => void;
  setDensity: (density: CompactDisplayDensity) => void;
  setGaugeStyle: (style: CompactVisualGauge) => void;
  setOpacity: (opacity: number) => void;
  setAccentColor: (accent: CompactAccentColor) => void;
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>;
  toggleAlwaysOnTop: () => Promise<void>;
  setClickThrough: (clickThrough: boolean) => Promise<void>;
  setShowTitleBar: (show: boolean) => void;
  toggleSpec: (id: CompactSpecId) => void;
  updateSpecConfig: (id: CompactSpecId, config: Partial<CompactSpecItemConfig>) => void;
  reorderSpecs: (orderedIds: CompactSpecId[]) => void;
  setIsCustomizerOpen: (open: boolean) => void;
  resetToDefaults: () => void;
}

export const useCompactStore = create<CompactStoreState>((set, get) => ({
  settings: loadStoredSettings(),
  isCustomizerOpen: false,

  setLayoutMode: (layoutMode) => {
    const next = { ...get().settings, layoutMode };
    saveStoredSettings(next);
    set({ settings: next });
  },

  setDensity: (density) => {
    const next = { ...get().settings, density };
    saveStoredSettings(next);
    set({ settings: next });
  },

  setGaugeStyle: (gaugeStyle) => {
    const next = { ...get().settings, gaugeStyle };
    saveStoredSettings(next);
    set({ settings: next });
  },

  setOpacity: (opacity) => {
    const clamped = Math.max(30, Math.min(100, Math.round(opacity)));
    const next = { ...get().settings, opacity: clamped };
    saveStoredSettings(next);
    set({ settings: next });
  },

  setAccentColor: (accentColor) => {
    const next = { ...get().settings, accentColor };
    saveStoredSettings(next);
    set({ settings: next });
  },

  setAlwaysOnTop: async (alwaysOnTop) => {
    const next = { ...get().settings, alwaysOnTop };
    saveStoredSettings(next);
    set({ settings: next });
    if (window.sentinelAPI?.setCompactAlwaysOnTop) {
      await window.sentinelAPI.setCompactAlwaysOnTop(alwaysOnTop);
    }
  },

  toggleAlwaysOnTop: async () => {
    const current = get().settings.alwaysOnTop;
    await get().setAlwaysOnTop(!current);
  },

  setClickThrough: async (clickThrough) => {
    const next = { ...get().settings, clickThrough };
    saveStoredSettings(next);
    set({ settings: next });
    if (window.sentinelAPI?.setCompactClickThrough) {
      await window.sentinelAPI.setCompactClickThrough(clickThrough);
    }
  },

  setShowTitleBar: (showTitleBar) => {
    const next = { ...get().settings, showTitleBar };
    saveStoredSettings(next);
    set({ settings: next });
  },

  toggleSpec: (id) => {
    const currentSpecs = get().settings.specs;
    const currentConfig = currentSpecs[id] || {
      enabled: false,
      order: 99,
      showSparkline: false,
      showDetails: true,
    };
    const nextSpecs = {
      ...currentSpecs,
      [id]: {
        ...currentConfig,
        enabled: !currentConfig.enabled,
      },
    };
    const next = { ...get().settings, specs: nextSpecs };
    saveStoredSettings(next);
    set({ settings: next });
  },

  updateSpecConfig: (id, partial) => {
    const currentSpecs = get().settings.specs;
    const currentConfig = currentSpecs[id] || {
      enabled: true,
      order: 99,
      showSparkline: false,
      showDetails: true,
    };
    const nextSpecs = {
      ...currentSpecs,
      [id]: {
        ...currentConfig,
        ...partial,
      },
    };
    const next = { ...get().settings, specs: nextSpecs };
    saveStoredSettings(next);
    set({ settings: next });
  },

  reorderSpecs: (orderedIds) => {
    const currentSpecs = { ...get().settings.specs };
    orderedIds.forEach((id, idx) => {
      if (currentSpecs[id]) {
        currentSpecs[id] = { ...currentSpecs[id], order: idx + 1 };
      }
    });
    const next = { ...get().settings, specs: currentSpecs };
    saveStoredSettings(next);
    set({ settings: next });
  },

  setIsCustomizerOpen: (isCustomizerOpen) => set({ isCustomizerOpen }),

  resetToDefaults: () => {
    saveStoredSettings(DEFAULT_COMPACT_SETTINGS);
    set({ settings: DEFAULT_COMPACT_SETTINGS });
    if (window.sentinelAPI?.setCompactAlwaysOnTop) {
      window.sentinelAPI.setCompactAlwaysOnTop(DEFAULT_COMPACT_SETTINGS.alwaysOnTop);
    }
  },
}));

