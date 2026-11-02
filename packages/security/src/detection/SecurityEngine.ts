import { FimEngine } from '../integrity/FimEngine.js';
import { PostureEvaluator } from '../posture/PostureEvaluator.js';
import { ProcessAuditor } from '../auditing/ProcessAuditor.js';
import type {
  SecurityAlert,
  SecurityPosture,
  FimScanResult,
  ProcessInfo,
  NetworkConnection,
} from '@sentinel/contracts';
import { defaultLogger } from '@sentinel/logger';

export class SecurityEngine {
  private fim = new FimEngine();
  private posture = new PostureEvaluator();
  private auditor = new ProcessAuditor();

  private alerts: Map<string, SecurityAlert> = new Map();

  constructor() {
    // Seed initial informational welcome audit alert
    const welcomeAlert: SecurityAlert = {
      id: 'alert-init-welcome',
      timestamp: Date.now(),
      severity: 'INFO',
      category: 'SYSTEM',
      ruleId: 'SEC-INFO-001',
      title: 'Sentinel Defensive Monitoring Initialized',
      description:
        'Continuous host security auditing, file integrity baselining, and network anomaly detection are actively running.',
      affectedResource: 'Sentinel Workstation Engine',
      evidence: { engineVersion: '1.0.0', status: 'ACTIVE' },
      recommendation:
        'Periodically review security posture and run File Integrity scans on sensitive configuration paths.',
      isAcknowledged: false,
    };
    this.alerts.set(welcomeAlert.id, welcomeAlert);
  }

  public async evaluatePosture(): Promise<SecurityPosture> {
    const unackCount = Array.from(this.alerts.values()).filter(
      (a) => !a.isAcknowledged && a.severity !== 'INFO'
    ).length;
    return this.posture.evaluatePosture(unackCount);
  }

  public auditSystemState(processes: ProcessInfo[], connections: NetworkConnection[]): SecurityAlert[] {
    try {
      const newAlerts = this.auditor.auditProcessesAndSockets(processes, connections);
      for (const alert of newAlerts) {
        // Prevent duplicate spam for the same rule & resource
        const existingKey = Array.from(this.alerts.values()).find(
          (a) => a.ruleId === alert.ruleId && a.affectedResource === alert.affectedResource
        );
        if (!existingKey) {
          this.alerts.set(alert.id, alert);
        }
      }
    } catch (err) {
      defaultLogger.error({ err }, 'Error during security audit cycle');
    }

    return this.getAlerts();
  }

  public getAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  public dismissAlert(alertId: string): boolean {
    if (this.alerts.has(alertId)) {
      const a = this.alerts.get(alertId)!;
      a.isAcknowledged = true;
      return true;
    }
    return false;
  }

  public async runFimScan(targetDir?: string): Promise<FimScanResult> {
    const dir =
      targetDir ||
      (process.platform === 'win32'
        ? 'C:\\Windows\\System32\\drivers\\etc'
        : '/etc');
    return this.fim.scanDirectory(dir);
  }
}
