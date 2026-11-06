import { z } from 'zod';

export const CompactSpecIdSchema = z.enum([
  'cpu',
  'memory',
  'gpu',
  'network',
  'disk',
  'security',
  'battery',
  'processes',
  'system',
]);

export type CompactSpecId = z.infer<typeof CompactSpecIdSchema>;

export const CompactLayoutModeSchema = z.enum(['vertical', 'horizontal', 'grid']);
export type CompactLayoutMode = z.infer<typeof CompactLayoutModeSchema>;

export const CompactDisplayDensitySchema = z.enum(['ultra-compact', 'compact', 'detailed']);
export type CompactDisplayDensity = z.infer<typeof CompactDisplayDensitySchema>;

export const CompactVisualGaugeSchema = z.enum(['bar', 'sparkline', 'gauge', 'minimal']);
export type CompactVisualGauge = z.infer<typeof CompactVisualGaugeSchema>;

export const CompactAccentColorSchema = z.enum([
  'cyan',
  'emerald',
  'purple',
  'blue',
  'amber',
  'rose',
]);
export type CompactAccentColor = z.infer<typeof CompactAccentColorSchema>;

export const CompactSpecItemConfigSchema = z.object({
  enabled: z.boolean().default(true),
  order: z.number().default(0),
  showSparkline: z.boolean().optional().default(false),
  showDetails: z.boolean().optional().default(true),
});
export type CompactSpecItemConfig = z.infer<typeof CompactSpecItemConfigSchema>;

export const CompactSettingsSchema = z.object({
  layoutMode: CompactLayoutModeSchema.default('vertical'),
  density: CompactDisplayDensitySchema.default('compact'),
  gaugeStyle: CompactVisualGaugeSchema.default('bar'),
  opacity: z.number().min(30).max(100).default(90),
  alwaysOnTop: z.boolean().default(true),
  accentColor: CompactAccentColorSchema.default('cyan'),
  specs: z.record(CompactSpecIdSchema, CompactSpecItemConfigSchema).default({
    cpu: { enabled: true, order: 1, showSparkline: true, showDetails: true },
    memory: { enabled: true, order: 2, showSparkline: true, showDetails: true },
    gpu: { enabled: true, order: 3, showSparkline: false, showDetails: true },
    network: { enabled: true, order: 4, showSparkline: false, showDetails: true },
    disk: { enabled: true, order: 5, showSparkline: false, showDetails: true },
    security: { enabled: true, order: 6, showSparkline: false, showDetails: true },
    battery: { enabled: true, order: 7, showSparkline: false, showDetails: false },
    processes: { enabled: true, order: 8, showSparkline: false, showDetails: false },
    system: { enabled: false, order: 9, showSparkline: false, showDetails: false },
  }),
  showTitleBar: z.boolean().default(true),
  pinned: z.boolean().default(true),
  clickThrough: z.boolean().default(false),
});

export type CompactSettings = z.infer<typeof CompactSettingsSchema>;

export const DEFAULT_COMPACT_SETTINGS: CompactSettings = CompactSettingsSchema.parse({});

