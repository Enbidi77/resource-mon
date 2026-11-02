import { create } from 'zustand';
import type { SystemMetricsSnapshot } from '@sentinel/contracts';

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
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  current: null,
  history: [],
  maxPoints: 30,
  isStreaming: true,
  intervalMs: 1000,

  setCurrentMetrics: (snapshot: SystemMetricsSnapshot) => {
    const timeStr = new Date(snapshot.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

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
      const updated = [...state.history, newPoint];
      if (updated.length > state.maxPoints) {
        updated.shift();
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
}));

