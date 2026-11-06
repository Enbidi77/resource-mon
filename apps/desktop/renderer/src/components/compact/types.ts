import React from "react";
import type {
  SystemMetricsSnapshot,
  SystemOverview,
  CompactSpecId,
  CompactSettings,
  CompactSpecItemConfig,
} from "@sentinel/contracts";

export interface MetricHistoryPoint {
  time: string;
  cpu: number;
  memoryPercent: number;
  netRxKb: number;
  netTxKb: number;
  diskReadKb: number;
  diskWriteKb: number;
  integrity: number;
}

export interface SpecRenderContext {
  metrics: SystemMetricsSnapshot | null;
  overview: SystemOverview | null;
  history: MetricHistoryPoint[];
  settings: CompactSettings;
  config: CompactSpecItemConfig;
}

export type SpecStatus = "optimal" | "warning" | "danger" | "info" | "neutral";

export interface SpecValue {
  primary: string;
  secondary?: string;
  percent?: number;
  status?: SpecStatus;
  sparklinePoints?: number[];
  details?: Array<{ label: string; value: string }>;
}

export interface SpecDefinition {
  id: CompactSpecId;
  label: string;
  shortLabel: string;
  description: string;
  category: "compute" | "storage" | "network" | "security" | "system";
  icon: React.ComponentType<{ className?: string }>;
  extract: (context: SpecRenderContext) => SpecValue;
}

