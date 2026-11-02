import { z } from 'zod';

export const ProcessSignatureStatusEnum = z.enum([
  'VALID',
  'INVALID',
  'UNSIGNED',
  'UNCHECKED',
  'SELF_SIGNED',
]);

export const ProcessInfoSchema = z.object({
  pid: z.number(),
  ppid: z.number().nullable().optional(),
  name: z.string(),
  cpuPercent: z.number(),
  memoryBytes: z.number(),
  memoryWorkingSetBytes: z.number().optional(),
  memoryPercent: z.number().optional(),
  threadCount: z.number().optional(),
  handleCount: z.number().optional(),
  executablePath: z.string().nullable().optional(),
  commandLine: z.string().nullable().optional(),
  user: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  status: z.string().optional(),
  isElevated: z.boolean().optional(),
  isCriticalSystem: z.boolean().optional(),
  signatureStatus: ProcessSignatureStatusEnum.optional(),
  signatureSigner: z.string().nullable().optional(),
  sha256: z.string().nullable().optional(),
});

export type ProcessInfo = z.infer<typeof ProcessInfoSchema>;

export const ProcessDetailSchema = ProcessInfoSchema.extend({
  parentName: z.string().nullable().optional(),
  children: z.array(z.number()).optional(),
  associatedPorts: z.array(z.number()).optional(),
  modules: z.array(z.string()).optional(),
  environment: z.record(z.string()).optional(),
});

export type ProcessDetail = z.infer<typeof ProcessDetailSchema>;

export const ProcessActionRequestSchema = z.object({
  pid: z.number(),
  action: z.enum(['terminate', 'suspend', 'resume']),
  force: z.boolean().optional(),
});

export type ProcessActionRequest = z.infer<typeof ProcessActionRequestSchema>;

export const ProcessActionResultSchema = z.object({
  success: z.boolean(),
  pid: z.number(),
  action: z.string(),
  error: z.string().optional(),
});

export type ProcessActionResult = z.infer<typeof ProcessActionResultSchema>;

