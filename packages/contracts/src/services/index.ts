import { z } from 'zod';

export const WindowsServiceStatusEnum = z.enum([
  'RUNNING',
  'STOPPED',
  'PAUSED',
  'START_PENDING',
  'STOP_PENDING',
  'UNKNOWN',
]);

export const WindowsServiceStartupEnum = z.enum([
  'AUTOMATIC',
  'MANUAL',
  'DISABLED',
  'BOOT',
  'SYSTEM',
  'UNKNOWN',
]);

export const WindowsServiceSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  status: WindowsServiceStatusEnum,
  startupType: WindowsServiceStartupEnum,
  description: z.string().optional(),
  binPath: z.string().optional(),
  serviceAccount: z.string().optional(),
  pid: z.number().nullable().optional(),
});

export type WindowsService = z.infer<typeof WindowsServiceSchema>;

export const ServiceControlRequestSchema = z.object({
  serviceName: z.string(),
  action: z.enum(['start', 'stop', 'restart']),
});

export type ServiceControlRequest = z.infer<typeof ServiceControlRequestSchema>;

export const ServiceControlResultSchema = z.object({
  success: z.boolean(),
  serviceName: z.string(),
  action: z.string(),
  error: z.string().optional(),
});

export type ServiceControlResult = z.infer<typeof ServiceControlResultSchema>;
