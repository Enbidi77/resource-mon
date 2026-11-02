import { z } from 'zod';

export const SocketProtocolEnum = z.enum(['TCP', 'UDP']);
export const SocketStateEnum = z.enum([
  'ESTABLISHED',
  'SYN_SENT',
  'SYN_RECV',
  'FIN_WAIT1',
  'FIN_WAIT2',
  'TIME_WAIT',
  'CLOSED',
  'CLOSE_WAIT',
  'LAST_ACK',
  'LISTEN',
  'CLOSING',
  'UNKNOWN',
]);

export const NetworkConnectionSchema = z.object({
  id: z.string(),
  protocol: SocketProtocolEnum,
  localAddress: z.string(),
  localPort: z.number(),
  remoteAddress: z.string().nullable().optional(),
  remotePort: z.number().nullable().optional(),
  state: SocketStateEnum,
  pid: z.number(),
  processName: z.string().optional(),
  isSuspicious: z.boolean().optional(),
  suspiciousReason: z.string().optional(),
});

export type NetworkConnection = z.infer<typeof NetworkConnectionSchema>;

export const NetworkInterfaceSchema = z.object({
  iface: z.string(),
  ifaceName: z.string(),
  ip4: z.string().optional(),
  ip6: z.string().optional(),
  mac: z.string(),
  internal: z.boolean(),
  virtual: z.boolean().optional(),
  operstate: z.string().optional(),
  type: z.string().optional(),
  speedMbps: z.number().nullable().optional(),
  rxBytes: z.number().optional(),
  txBytes: z.number().optional(),
  rxSec: z.number().optional(),
  txSec: z.number().optional(),
});

export type NetworkInterface = z.infer<typeof NetworkInterfaceSchema>;

