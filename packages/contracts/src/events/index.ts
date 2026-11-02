import { z } from 'zod';

export const WindowsEventLevelEnum = z.enum([
  'CRITICAL',
  'ERROR',
  'WARNING',
  'INFORMATION',
  'VERBOSE',
]);

export const WindowsEventLogEntrySchema = z.object({
  id: z.string(),
  logName: z.enum(['System', 'Application', 'Security']),
  eventId: z.number(),
  level: WindowsEventLevelEnum,
  source: z.string(),
  timeGenerated: stringDateOrNumber(),
  message: z.string(),
  user: z.string().nullable().optional(),
  computer: z.string().optional(),
});

function stringDateOrNumber() {
  return z.union([z.string(), z.number()]);
}

export type WindowsEventLogEntry = z.infer<typeof WindowsEventLogEntrySchema>;

export const QueryEventsRequestSchema = z.object({
  logName: z.enum(['System', 'Application', 'Security']),
  limit: z.number().default(50),
  level: WindowsEventLevelEnum.optional(),
  filterText: z.string().optional(),
});

export type QueryEventsRequest = z.infer<typeof QueryEventsRequestSchema>;

