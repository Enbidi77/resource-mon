import { AdapterFactory, ISystemAdapter } from "@sentinel/system-adapter";
import { SystemCollector } from "@sentinel/monitoring";
import { SecurityEngine } from "@sentinel/security";
import { SentinelDatabase } from "@sentinel/storage";
import { EventLogReader } from "../events/EventLogReader.js";
import { ReportGenerator } from "../reports/ReportGenerator.js";
import {
  Kernel32Bridge,
  Advapi32Bridge,
  AuthenticodeVerifier,
} from "@sentinel/native-bridge";
import { defaultLogger } from "@sentinel/logger";
import {
  disposeSafely,
  disposeSafelyAsync,
  type SubscriptionDisposable,
} from "@sentinel/shared";
import type {
  SystemOverview,
  SystemMetricsSnapshot,
  ProcessInfo,
  ProcessDetail,
  ProcessActionRequest,
  ProcessActionResult,
  NetworkConnection,
  NetworkInterface,
  WindowsService,
  ServiceControlRequest,
  ServiceControlResult,
  SecurityPosture,
  SecurityAlert,
  FimScanResult,
  SecurityAuditReport,
  BinaryAnalysisResult,
  HardwareSummary,
  WindowsEventLogEntry,
  QueryEventsRequest,
  ReportConfig,
  GeneratedReport,
} from "@sentinel/contracts";

export class SentinelCoreService implements Disposable, AsyncDisposable {
  private adapter: ISystemAdapter;
  private collector: SystemCollector;
  private security: SecurityEngine;
  private database: SentinelDatabase;
  private eventReader: EventLogReader;
  private reportGen: ReportGenerator;
  private isDestroyed = false;

  private kernel32 = new Kernel32Bridge();
  private advapi32 = new Advapi32Bridge();
  private verifier = new AuthenticodeVerifier();

  constructor() {
    this.adapter = AdapterFactory.getAdapter();
    this.collector = new SystemCollector(this.adapter, 60, 1000);
    this.security = new SecurityEngine();
    this.database = new SentinelDatabase();
    this.eventReader = new EventLogReader();
    this.reportGen = new ReportGenerator();

    // Persist every incoming metric tick to SQLite and evaluate security rules
    this.collector.subscribe((metric) => {
      this.database.recordMetric(metric);
    });

    // Start background collector
    this.collector.start();

    // Trigger initial background audit
    this.runBackgroundAudit();
  }

  public getOverview(): Promise<SystemOverview> {
    return this.adapter.getOverview();
  }

  public getMetricsSnapshot(): Promise<SystemMetricsSnapshot> {
    return this.collector.getLatestSnapshot();
  }

  public onSystemMetrics(
    callback: (snapshot: SystemMetricsSnapshot) => void,
  ): SubscriptionDisposable {
    return this.collector.subscribe(callback);
  }

  public toggleMetricsStream(enabled: boolean, intervalMs?: number): boolean {
    if (intervalMs) {
      this.collector.setIntervalMs(intervalMs);
    }
    if (enabled) {
      this.collector.start();
    } else {
      this.collector.stop();
    }
    return true;
  }

  public setIntervalMs(intervalMs: number): void {
    this.collector.setIntervalMs(intervalMs);
  }

  public async getProcesses(): Promise<ProcessInfo[]> {
    const list = await this.adapter.getProcesses();
    return list;
  }

  public getProcessDetails(pid: number): Promise<ProcessDetail | null> {
    return this.adapter.getProcessDetails(pid);
  }

  public async controlProcess(
    req: ProcessActionRequest,
  ): Promise<ProcessActionResult> {
    if (req.action === "terminate") {
      const res = await this.kernel32.terminateProcess(req.pid);
      return {
        success: res.success,
        pid: req.pid,
        action: "terminate",
        error: res.error,
      };
    }
    return {
      success: false,
      pid: req.pid,
      action: req.action,
      error: "Action not supported natively",
    };
  }

  public async verifyProcessSignature(
    filePath: string,
  ): Promise<{ status: string; signer?: string | null }> {
    return this.verifier.verifySignature(filePath);
  }

  public async computeProcessHash(
    filePath: string,
  ): Promise<{ sha256?: string | null; error?: string }> {
    try {
      const sha256 = await this.verifier.computeFileSha256(filePath);
      return { sha256 };
    } catch (err: any) {
      return { error: err?.message || String(err) };
    }
  }

  public getNetworkConnections(): Promise<NetworkConnection[]> {
    return this.adapter.getNetworkConnections();
  }

  public getNetworkInterfaces(): Promise<NetworkInterface[]> {
    return this.adapter.getNetworkInterfaces();
  }

  public getServices(): Promise<WindowsService[]> {
    return this.adapter.getServices();
  }

  public async controlService(
    req: ServiceControlRequest,
  ): Promise<ServiceControlResult> {
    const res = await this.advapi32.controlService(req.serviceName, req.action);
    return {
      success: res.success,
      serviceName: req.serviceName,
      action: req.action,
      error: res.error,
    };
  }

  public getSecurityPosture(): Promise<SecurityPosture> {
    return this.security.evaluatePosture();
  }

  public getSecurityAlerts(): SecurityAlert[] {
    return this.security.getAlerts();
  }

  public dismissAlert(alertId: string): boolean {
    return this.security.dismissAlert(alertId);
  }

  public runFimScan(dir?: string): Promise<FimScanResult> {
    return this.security.runFimScan(dir);
  }

  public async runSecurityAudit(): Promise<SecurityAuditReport> {
    const [services, connections, processes] = await Promise.all([
      this.adapter.getServices(),
      this.adapter.getNetworkConnections(),
      this.adapter.getProcesses(),
    ]);
    return this.security.runSecurityAudit(services, connections, processes);
  }

  public async analyzeBinary(target: {
    filePath?: string;
    pid?: number;
  }): Promise<BinaryAnalysisResult> {
    const processes = await this.adapter.getProcesses();
    return this.security.analyzeBinary(target, processes);
  }

  public queryEvents(req: QueryEventsRequest): Promise<WindowsEventLogEntry[]> {
    return this.eventReader.queryEvents(req);
  }

  public getHardwareSummary(): Promise<HardwareSummary> {
    return this.adapter.getHardwareSummary();
  }

  public async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    const [overview, metrics, processes, connections, alerts, hardware] =
      await Promise.all([
        config.includeMetrics ? this.getOverview() : undefined,
        config.includeMetrics ? this.getMetricsSnapshot() : undefined,
        config.includeProcesses ? this.getProcesses() : undefined,
        config.includeNetwork ? this.getNetworkConnections() : undefined,
        config.includeSecurity ? this.getSecurityAlerts() : undefined,
        config.includeHardware ? this.getHardwareSummary() : undefined,
      ]);

    return this.reportGen.generate(config, {
      overview,
      metrics,
      processes,
      connections,
      alerts,
      hardware,
    });
  }

  private async runBackgroundAudit(): Promise<void> {
    try {
      const [procs, conns] = await Promise.all([
        this.adapter.getProcesses(),
        this.adapter.getNetworkConnections(),
      ]);
      const alerts = this.security.auditSystemState(procs, conns);
      for (const alert of alerts) {
        this.database.recordAlert(alert);
      }
    } catch (err) {
      defaultLogger.debug({ err }, "Background security audit cycle note");
    }
  }

  /**
   * Synchronously terminates collectors, flushes the SQLite/WAL database,
   * and disposes underlying system adapter handles.
   * Idempotent: repeated calls are safely ignored.
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    disposeSafely(this.collector);
    disposeSafely(this.database);
    disposeSafely(this.adapter);
  }

  /**
   * Asynchronously awaits completion of flushes and non-blocking teardowns.
   */
  public async destroyAsync(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    disposeSafely(this.collector);
    await disposeSafelyAsync(this.database);
    await disposeSafelyAsync(this.adapter);
  }

  /**
   * Synchronous Disposable interface implementation.
   * Supports deterministic scoping via `using service = new SentinelCoreService()`.
   */
  public [Symbol.dispose](): void {
    this.destroy();
  }

  /**
   * Asynchronous AsyncDisposable interface implementation.
   * Supports deterministic scoping via `await using service = new SentinelCoreService()`.
   */
  public async [Symbol.asyncDispose](): Promise<void> {
    await this.destroyAsync();
  }
}
