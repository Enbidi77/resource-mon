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

// --- Security Analyzer Contracts ---

export const HardeningCheckSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['IDENTITY', 'SYSTEM', 'NETWORK', 'SERVICES', 'STORAGE']),
  severity: AlertSeverityEnum,
  status: z.enum(['PASS', 'WARN', 'FAIL', 'UNKNOWN']),
  details: z.string(),
  recommendation: z.string(),
});

export type HardeningCheck = z.infer<typeof HardeningCheckSchema>;

export const UnquotedServiceFindingSchema = z.object({
  serviceName: z.string(),
  displayName: z.string(),
  binPath: z.string(),
  vulnerablePathSegment: z.string(),
});

export type UnquotedServiceFinding = z.infer<typeof UnquotedServiceFindingSchema>;

export const ExposedPortFindingSchema = z.object({
  port: z.number(),
  protocol: z.enum(['TCP', 'UDP']),
  localAddress: z.string().optional(),
  serviceName: z.string(),
  risk: z.enum(['CRITICAL', 'HIGH', 'MEDIUM']),
  pid: z.number(),
  processName: z.string(),
});

export type ExposedPortFinding = z.infer<typeof ExposedPortFindingSchema>;

export const PersistenceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: z.enum([
    'REGISTRY_HKCU_RUN',
    'REGISTRY_HKLM_RUN',
    'REGISTRY_RUNONCE',
    'STARTUP_FOLDER',
    'SCHEDULED_TASK',
  ]),
  location: z.string(),
  targetPath: z.string(),
  args: z.string().optional(),
  exists: z.boolean(),
  isSigned: z.boolean().nullable().optional(),
  publisher: z.string().nullable().optional(),
  risk: z.enum(['BENIGN', 'SUSPICIOUS', 'UNVERIFIED']),
});

export type PersistenceItem = z.infer<typeof PersistenceItemSchema>;

export const BinaryAnalysisResultSchema = z.object({
  target: z.string(),
  pid: z.number().nullable().optional(),
  entropy: z.number(), // 0.0 - 8.0
  isPacked: z.boolean(),
  authenticodeStatus: z.string(),
  signer: z.string().nullable().optional(),
  sha256: z.string().nullable().optional(),
  sizeBytes: z.number(),
  riskScore: z.number(), // 0 - 100
  riskLevel: z.enum(['CLEAN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  riskFactors: z.array(z.string()),
  analyzedAt: z.number(),
});

export type BinaryAnalysisResult = z.infer<typeof BinaryAnalysisResultSchema>;

export const SecurityAuditReportSchema = z.object({
  timestamp: z.number(),
  overallAuditScore: z.number(), // 0 - 100
  statusLevel: z.enum(['OPTIMAL', 'ELEVATED', 'GUARDED', 'COMPROMISED']),
  hardeningChecks: z.array(HardeningCheckSchema),
  unquotedServices: z.array(UnquotedServiceFindingSchema),
  exposedPorts: z.array(ExposedPortFindingSchema),
  persistenceItems: z.array(PersistenceItemSchema),
  analyzedProcesses: z.array(BinaryAnalysisResultSchema),
});

export type SecurityAuditReport = z.infer<typeof SecurityAuditReportSchema>;
