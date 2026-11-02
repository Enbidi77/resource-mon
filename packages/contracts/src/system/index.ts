import { z } from 'zod';

export const SystemOverviewSchema = z.object({
  hostname: z.string(),
  platform: z.string(),
  arch: z.string(),
  osName: z.string(),
  osRelease: z.string(),
  osBuild: z.string().optional(),
  uptimeSeconds: z.number(),
  bootTime: z.string(),
  cpuBrand: z.string(),
  cpuCores: z.number(),
  cpuPhysicalCores: z.number(),
  cpuBaseSpeedGhz: z.number(),
  totalMemoryBytes: z.number(),
  isElevated: z.boolean(),
  sentinelVersion: z.string(),
});

export type SystemOverview = z.infer<typeof SystemOverviewSchema>;

export const CoreMetricSchema = z.object({
  coreIndex: z.number(),
  loadPercent: z.number(),
  frequencyMhz: z.number().optional(),
});

export const GpuMetricSchema = z.object({
  model: z.string(),
  loadPercent: z.number(),
  memoryUsedBytes: z.number(),
  memoryTotalBytes: z.number(),
  temperatureC: z.number().nullable().optional(),
});

export const SystemMetricsSnapshotSchema = z.object({
  timestamp: z.number(),
  cpuTotal: z.number(),
  cpuCores: z.array(CoreMetricSchema),
  memoryUsedBytes: z.number(),
  memoryTotalBytes: z.number(),
  memoryFreeBytes: z.number(),
  memoryCachedBytes: z.number().optional(),
  memoryPercent: z.number(),
  gpu: z.array(GpuMetricSchema).optional(),
  diskReadBytesPerSec: z.number(),
  diskWriteBytesPerSec: z.number(),
  networkDownloadBytesPerSec: z.number(),
  networkUploadBytesPerSec: z.number(),
  activeProcessesCount: z.number(),
  activeSocketsCount: z.number(),
  systemIntegrityScore: z.number(), // 0 - 100 calculated defensive posture
});

export type SystemMetricsSnapshot = z.infer<typeof SystemMetricsSnapshotSchema>;
export type CoreMetric = z.infer<typeof CoreMetricSchema>;
export type GpuMetric = z.infer<typeof GpuMetricSchema>;
