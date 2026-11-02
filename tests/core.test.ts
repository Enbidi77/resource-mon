import { describe, it, expect } from 'vitest';
import { formatBytes, formatSpeed, formatPercentage, formatDuration } from '../packages/shared/src/formatters.js';
import { RingBuffer } from '../packages/monitoring/src/history/RingBuffer.js';
import { ProcessAuditor } from '../packages/security/src/auditing/ProcessAuditor.js';
import { MockSystemAdapter } from '../packages/testing/src/index.js';
import { SystemMetricsSnapshotSchema, ProcessInfoSchema } from '../packages/contracts/src/index.js';

describe('Shared Formatters', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 2)).toBe('2 GB');
  });

  it('formats speed throughput', () => {
    expect(formatSpeed(1048576)).toBe('1 MB/s');
  });

  it('formats percentages', () => {
    expect(formatPercentage(76.249)).toBe('76.2%');
  });

  it('formats durations', () => {
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });
});

describe('Monitoring RingBuffer', () => {
  it('maintains fixed capacity and rolls over correctly', () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    rb.push(2);
    rb.push(3);
    expect(rb.toArray()).toEqual([1, 2, 3]);

    rb.push(4);
    expect(rb.toArray()).toEqual([2, 3, 4]);

    rb.push(5);
    expect(rb.toArray()).toEqual([3, 4, 5]);
  });
});

describe('Security Auditor Rules', () => {
  it('detects suspicious process execution from AppData\\Local\\Temp', () => {
    const auditor = new ProcessAuditor();
    const alerts = auditor.auditProcessesAndSockets(
      [
        {
          pid: 9999,
          name: 'payload.exe',
          cpuPercent: 5,
          memoryBytes: 10000,
          executablePath: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\payload.exe',
        },
      ],
      []
    );

    expect(alerts.length).toBe(1);
    expect(alerts[0].ruleId).toBe('SEC-RULE-001');
    expect(alerts[0].severity).toBe('HIGH');
  });

  it('detects office process spawning powershell', () => {
    const auditor = new ProcessAuditor();
    const alerts = auditor.auditProcessesAndSockets(
      [
        {
          pid: 100,
          name: 'winword.exe',
          cpuPercent: 1,
          memoryBytes: 50000000,
        },
        {
          pid: 101,
          ppid: 100,
          name: 'powershell.exe',
          cpuPercent: 2,
          memoryBytes: 30000000,
          commandLine: 'powershell.exe -enc AAAA==',
        },
      ],
      []
    );

    expect(alerts.length).toBe(1);
    expect(alerts[0].ruleId).toBe('SEC-RULE-003');
    expect(alerts[0].severity).toBe('CRITICAL');
  });
});

describe('Mock System Adapter & Contracts', () => {
  it('conforms to contracts schemas', async () => {
    const adapter = new MockSystemAdapter();
    const metrics = await adapter.getMetricsSnapshot();
    const parsedMetrics = SystemMetricsSnapshotSchema.safeParse(metrics);
    expect(parsedMetrics.success).toBe(true);

    const procs = await adapter.getProcesses();
    expect(procs.length).toBeGreaterThan(0);
    const parsedProc = ProcessInfoSchema.safeParse(procs[0]);
    expect(parsedProc.success).toBe(true);
  });
});
