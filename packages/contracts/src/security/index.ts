import { z } from 'zod';

export const AlertSeverityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
export const AlertCategoryEnum = z.enum([
  'PROCESS',
  'NETWORK',
  'INTEGRITY',
  'POSTURE',
  'SYSTEM',
]);

export const SecurityAlertSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  severity: AlertSeverityEnum,
  category: AlertCategoryEnum,
  ruleId: z.string(),
  title: z.string(),
  description: z.string(),
  affectedResource: z.string(),
  evidence: z.record(z.unknown()),
  recommendation: z.string(),
  isAcknowledged: z.boolean().default(false),
});

export type SecurityAlert = z.infer<typeof SecurityAlertSchema>;

export const SecurityPostureSchema = z.object({
  overallScore: z.number(), // 0 - 100
  statusLevel: z.enum(['OPTIMAL', 'ELEVATED', 'GUARDED', 'COMPROMISED']),
  antivirusName: z.string(),
  antivirusActive: z.boolean(),
  firewallActive: z.boolean(),
  secureBootEnabled: z.boolean().nullable().optional(),
  uacEnabled: z.boolean(),
  isElevatedAdmin: z.boolean(),
  pendingReboot: z.boolean().optional(),
  activeIncidentsCount: z.number(),
});

export type SecurityPosture = z.infer<typeof SecurityPostureSchema>;

export const FimEntryStatusEnum = z.enum(['CLEAN', 'MODIFIED', 'ADDED', 'DELETED']);

export const FimEntrySchema = z.object({
  filePath: z.string(),
  fileName: z.string(),
  sha256: z.string(),
  sizeBytes: z.number(),
  lastModified: z.string(),
  status: FimEntryStatusEnum,
  previousSha256: z.string().optional(),
});

export type FimEntry = z.infer<typeof FimEntrySchema>;

export const FimScanResultSchema = z.object({
  scannedFiles: z.number(),
  modifiedCount: z.number(),
  addedCount: z.number(),
  deletedCount: z.number(),
  timestamp: z.number(),
  directory: z.string(),
  entries: z.array(FimEntrySchema),
});

export type FimScanResult = z.infer<typeof FimScanResultSchema>;
