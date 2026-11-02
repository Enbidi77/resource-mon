import { z } from 'zod';

export const ReportConfigSchema = z.object({
  title: z.string(),
  format: z.enum(['json', 'csv', 'html']),
  includeMetrics: z.boolean().default(true),
  includeProcesses: z.boolean().default(true),
  includeNetwork: z.boolean().default(true),
  includeSecurity: z.boolean().default(true),
  includeHardware: z.boolean().default(true),
  redactSensitiveData: z.boolean().default(false),
});

export type ReportConfig = z.infer<typeof ReportConfigSchema>;

export const GeneratedReportSchema = z.object({
  reportId: z.string(),
  generatedAt: z.string(),
  format: z.enum(['json', 'csv', 'html']),
  filename: z.string(),
  content: z.string(),
  sizeBytes: z.number(),
});

export type GeneratedReport = z.infer<typeof GeneratedReportSchema>;
