import { z } from 'zod';

export const HardwareSummarySchema = z.object({
  cpu: z.object({
    manufacturer: z.string(),
    brand: z.string(),
    speedGhz: z.number(),
    cores: z.number(),
    physicalCores: z.number(),
    socket: z.string().optional(),
    virtualization: z.boolean().optional(),
  }),
  memory: z.object({
    totalBytes: z.number(),
    layout: z.array(
      z.object({
        sizeBytes: z.number(),
        bank: z.string().optional(),
        type: z.string().optional(),
        clockSpeedMhz: z.number().optional(),
        partNum: z.string().optional(),
      })
    ),
  }),
  gpus: z.array(
    z.object({
      vendor: z.string(),
      model: z.string(),
      vramMb: z.number().optional(),
      driverVersion: z.string().optional(),
    })
  ),
  disks: z.array(
    z.object({
      name: z.string(),
      type: z.string().optional(),
      sizeBytes: z.number(),
      interfaceType: z.string().optional(),
      smartStatus: z.string().optional(),
    })
  ),
  networkAdapters: z.array(
    z.object({
      name: z.string(),
      mac: z.string(),
      speedMbps: z.number().nullable().optional(),
      type: z.string().optional(),
    })
  ),
  system: z.object({
    manufacturer: z.string(),
    model: z.string(),
    version: z.string().optional(),
    serial: z.string().optional(),
  }),
  bios: z.object({
    vendor: z.string(),
    version: z.string(),
    releaseDate: z.string().optional(),
  }),
  baseboard: z.object({
    manufacturer: z.string(),
    model: z.string(),
    version: z.string().optional(),
  }),
  battery: z.object({
    hasBattery: z.boolean(),
    isCharging: z.boolean().optional(),
    percent: z.number().optional(),
  }).optional(),
});

export type HardwareSummary = z.infer<typeof HardwareSummarySchema>;

