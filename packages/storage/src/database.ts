import path from 'path';
import fs from 'fs';
import { defaultLogger } from '@sentinel/logger';
import type { SystemMetricsSnapshot, SecurityAlert } from '@sentinel/contracts';

export interface StoredMetricRecord {
  id: number;
  timestamp: number;
  cpu_total: number;
  memory_used: number;
  memory_total: number;
  disk_read: number;
  disk_write: number;
  net_download: number;
  net_upload: number;
  integrity_score: number;
}

export class SentinelDatabase {
  private baseDir: string;
  private metricsLogPath: string;
  private alertsPath: string;
  private inMemoryMetrics: StoredMetricRecord[] = [];
  private inMemoryAlerts: Map<string, SecurityAlert> = new Map();
  private nextId = 1;
  private appendStream: fs.WriteStream | null = null;

  constructor(customPath?: string) {
    this.baseDir =
      customPath ||
      path.join(
        process.env.APPDATA || process.env.HOME || '.',
        '.sentinel'
      );

    this.metricsLogPath = path.join(this.baseDir, 'metrics_history.wal');
    this.alertsPath = path.join(this.baseDir, 'security_alerts.json');

    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }

      // Initialize persistent metrics WAL stream
      this.appendStream = fs.createWriteStream(this.metricsLogPath, { flags: 'a' });

      // Load existing alerts if present
      if (fs.existsSync(this.alertsPath)) {
        const raw = fs.readFileSync(this.alertsPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const a of parsed) this.inMemoryAlerts.set(a.id, a);
        }
      }

      defaultLogger.info({ baseDir: this.baseDir }, 'Connected to Sentinel persistent storage engine');
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to initialize persistent file storage, running in-memory');
    }
  }

  public recordMetric(metric: SystemMetricsSnapshot): void {
    const record: StoredMetricRecord = {
      id: this.nextId++,
      timestamp: metric.timestamp,
      cpu_total: metric.cpuTotal,
      memory_used: metric.memoryUsedBytes,
      memory_total: metric.memoryTotalBytes,
      disk_read: metric.diskReadBytesPerSec,
      disk_write: metric.diskWriteBytesPerSec,
      net_download: metric.networkDownloadBytesPerSec,
      net_upload: metric.networkUploadBytesPerSec,
      integrity_score: metric.systemIntegrityScore,
    };

    this.inMemoryMetrics.push(record);
    if (this.inMemoryMetrics.length > 500) {
      this.inMemoryMetrics.shift();
    }

    if (this.appendStream && !this.appendStream.destroyed) {
      try {
        this.appendStream.write(JSON.stringify(record) + '\n');
      } catch (err) {
        defaultLogger.debug({ err }, 'Error writing metric to WAL');
      }
    }
  }

  public getRecentMetrics(limit: number = 60): StoredMetricRecord[] {
    return this.inMemoryMetrics.slice(-limit).reverse();
  }

  public recordAlert(alert: SecurityAlert): void {
    this.inMemoryAlerts.set(alert.id, alert);
    try {
      const arr = Array.from(this.inMemoryAlerts.values());
      fs.writeFileSync(this.alertsPath, JSON.stringify(arr, null, 2), 'utf8');
    } catch (err) {
      defaultLogger.error({ err }, 'Failed to persist alert to disk');
    }
  }

  public pruneOldRecords(hoursToKeep: number = 24): void {
    const cutoff = Date.now() - hoursToKeep * 3600 * 1000;
    this.inMemoryMetrics = this.inMemoryMetrics.filter((m) => m.timestamp >= cutoff);
  }

  public close(): void {
    if (this.appendStream && !this.appendStream.destroyed) {
      try {
        this.appendStream.end();
      } catch {}
    }
  }
}
