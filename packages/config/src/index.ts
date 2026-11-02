import { z } from 'zod';

export const AppSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  accentColor: z.enum(['cyan', 'blue', 'emerald', 'violet', 'amber']).default('cyan'),
  glassIntensity: z.enum(['low', 'medium', 'high']).default('high'),
  interfaceDensity: z.enum(['compact', 'comfortable']).default('comfortable'),
  reduceMotion: z.boolean().default(false),
  monitoring: z.object({
    fastIntervalMs: z.number().min(250).max(5000).default(1000),
    standardIntervalMs: z.number().min(1000).max(10000).default(3000),
    slowIntervalMs: z.number().min(5000).max(60000).default(10000),
    historyRetentionPoints: z.number().min(30).max(1000).default(60),
    enableHardwareSensors: z.boolean().default(true),
  }).default({}),
  security: z.object({
    enableUnsignedBinaryDetection: z.boolean().default(true),
    enableSuspiciousPathDetection: z.boolean().default(true),
    enableSuspiciousPortDetection: z.boolean().default(true),
    confirmDangerousActions: z.boolean().default(true),
    fimMonitoredPaths: z.array(z.string()).default([]),
  }).default({}),
  window: z.object({
    width: z.number().default(1320),
    height: z.number().default(840),
    isMaximized: z.boolean().default(false),
  }).default({}),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const DEFAULT_APP_SETTINGS: AppSettings = AppSettingsSchema.parse({});
