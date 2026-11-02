import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { defaultLogger } from '@sentinel/logger';
import type { SystemMetricsSnapshot, SecurityAlert } from '@sentinel/contracts';

export class SentinelDatabase {
  private db: Database.Database;

  constructor(customPath?: string) {
    const dbPath =
      customPath ||
      path.join(
        process.env.APPDATA || process.env.HOME || '.',
        '.sentinel',
        'sentinel.sqlite'
      );

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Fall back to in-memory if directory is not writable
      }
    }

    try {
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      defaultLogger.info({ dbPath }, 'Connected to SQLite database');
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to create disk SQLite db, falling back to :memory:');
      this.db = new Database(':memory:');
    }

    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        cpu_total REAL NOT NULL,
        memory_used INTEGER NOT NULL,
        memory_total INTEGER NOT NULL,
        disk_read REAL NOT NULL,
        disk_write REAL NOT NULL,
        net_download REAL NOT NULL,
        net_upload REAL NOT NULL,
        integrity_score REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp);

      CREATE TABLE IF NOT EXISTS security_alerts (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        affected_resource TEXT NOT NULL,
        evidence_json TEXT,
        recommendation TEXT,
        is_acknowledged INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON security_alerts(timestamp);

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  public recordMetric(metric: SystemMetricsSnapshot): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO metrics_history (
          timestamp, cpu_total, memory_used, memory_total,
          disk_read, disk_write, net_download, net_upload, integrity_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        metric.timestamp,
        metric.cpuTotal,
        metric.memoryUsedBytes,
        metric.memoryTotalBytes,
        metric.diskReadBytesPerSec,
        metric.diskWriteBytesPerSec,
        metric.networkDownloadBytesPerSec,
        metric.networkUploadBytesPerSec,
        metric.systemIntegrityScore
      );
    } catch (err) {
      defaultLogger.debug({ err }, 'Failed to insert metric record');
    }
  }

  public getRecentMetrics(limit: number = 60): any[] {
    try {
      return this.db
        .prepare('SELECT * FROM metrics_history ORDER BY timestamp DESC LIMIT ?')
        .all(limit);
    } catch {
      return [];
    }
  }

  public recordAlert(alert: SecurityAlert): void {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO security_alerts (
          id, timestamp, severity, category, rule_id, title,
          description, affected_resource, evidence_json, recommendation, is_acknowledged
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        alert.id,
        alert.timestamp,
        alert.severity,
        alert.category,
        alert.ruleId,
        alert.title,
        alert.description,
        alert.affectedResource,
        JSON.stringify(alert.evidence || {}),
        alert.recommendation,
        alert.isAcknowledged ? 1 : 0
      );
    } catch (err) {
      defaultLogger.error({ err }, 'Failed to record security alert to DB');
    }
  }

  public pruneOldRecords(hoursToKeep: number = 24): void {
    try {
      const cutoff = Date.now() - hoursToKeep * 3600 * 1000;
      this.db.prepare('DELETE FROM metrics_history WHERE timestamp < ?').run(cutoff);
    } catch (err) {
      defaultLogger.error({ err }, 'Failed to prune old metrics');
    }
  }

  public close(): void {
    try {
      this.db.close();
    } catch {}
  }
}

