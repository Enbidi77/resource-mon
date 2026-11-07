import { create } from "zustand";
import type { SystemMetricsSnapshot } from "@sentinel/contracts";

interface MetricPoint {
  time: string;
  cpu: number;
  memoryPercent: number;
  netRxKb: number;
  netTxKb: number;
  diskReadKb: number;
  diskWriteKb: number;
  integrity: number;
}

interface MetricsState {
  current: SystemMetricsSnapshot | null;
  history: MetricPoint[];
  maxPoints: number;
  isStreaming: boolean;
  intervalMs: number;
  setCurrentMetrics: (snapshot: SystemMetricsSnapshot) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIntervalMs: (ms: number) => void;
  optimizeMemory: () => Promise<boolean>;
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  current: null,
  history: [],
  maxPoints: 30,
  isStreaming: true,
  intervalMs: 1000,

  setCurrentMetrics: (snapshot: SystemMetricsSnapshot) => {
    const d = new Date(snapshot.timestamp);
    const baseTime = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const currentInterval = get().intervalMs;
    const timeStr =
      currentInterval < 1000
        ? `${baseTime}.${Math.floor(d.getMilliseconds() / 100)}`
        : baseTime;

    const newPoint: MetricPoint = {
      time: timeStr,
      cpu: snapshot.cpuTotal,
      memoryPercent: snapshot.memoryPercent,
      netRxKb: Math.round(snapshot.networkDownloadBytesPerSec / 1024),
      netTxKb: Math.round(snapshot.networkUploadBytesPerSec / 1024),
      diskReadKb: Math.round(snapshot.diskReadBytesPerSec / 1024),
      diskWriteKb: Math.round(snapshot.diskWriteBytesPerSec / 1024),
      integrity: snapshot.systemIntegrityScore,
    };

    set((state) => {
      // Dynamic history capacity ensures ~30s rolling time window capped to 60 points max
      const dynamicLimit = Math.min(
        60,
        Math.max(30, Math.round(30000 / state.intervalMs)),
      );
      const updated = [...state.history, newPoint];
      if (updated.length > dynamicLimit) {
        updated.splice(0, updated.length - dynamicLimit);
      }
      return {
        current: snapshot,
        history: updated,
      };
    });
  },

  setIsStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
    if (window.sentinelAPI) {
      window.sentinelAPI.toggleMetricsStream(streaming, get().intervalMs);
    }
  },

  setIntervalMs: (ms: number) => {
    set({ intervalMs: ms });
    if (window.sentinelAPI) {
      window.sentinelAPI.toggleMetricsStream(get().isStreaming, ms);
    }
  },

  optimizeMemory: async () => {
    if (window.sentinelAPI?.trimMemory) {
      try {
        const res = await window.sentinelAPI.trimMemory();
        return Boolean(res?.success);
      } catch {
        return false;
      }
    }
    return false;
  },
}));
