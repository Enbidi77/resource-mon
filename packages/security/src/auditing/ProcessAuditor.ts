import type {
  ProcessInfo,
  NetworkConnection,
  SecurityAlert,
} from '@sentinel/contracts';

export class ProcessAuditor {
  private suspiciousTempPaths = [
    '\\appdata\\local\\temp\\',
    '\\windows\\temp\\',
    '/tmp/',
    '/var/tmp/',
  ];

  private officeBinaries = new Set([
    'winword.exe',
    'excel.exe',
    'powerpnt.exe',
    'outlook.exe',
  ]);

  private scriptEngines = new Set([
    'powershell.exe',
    'cmd.exe',
    'wscript.exe',
    'cscript.exe',
    'mshta.exe',
  ]);

  private highRiskPorts = new Set([4444, 31337, 1337, 6667, 5555]);

  public auditProcessesAndSockets(
    processes: ProcessInfo[],
    connections: NetworkConnection[]
  ): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];
    const procMap = new Map<number, ProcessInfo>();
    for (const p of processes) procMap.set(p.pid, p);

    // 1. Audit Process Paths
    for (const p of processes) {
      const lowerPath = (p.executablePath || '').toLowerCase();

      // SEC-RULE-001: Execution from Temporary Directories
      if (lowerPath && this.suspiciousTempPaths.some((temp) => lowerPath.includes(temp))) {
        alerts.push({
          id: `alert-path-${p.pid}-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'HIGH',
          category: 'PROCESS',
          ruleId: 'SEC-RULE-001',
          title: `Executable running from temporary path: ${p.name}`,
          description: `Process "${p.name}" (PID ${p.pid}) is executing from a temporary directory, commonly associated with unverified downloads or malware dropper behavior.`,
          affectedResource: p.executablePath || p.name,
          evidence: {
            pid: p.pid,
            name: p.name,
            executablePath: p.executablePath,
            commandLine: p.commandLine,
          },
          recommendation:
            'Inspect the binary source, verify digital signatures, or terminate if untrusted.',
          isAcknowledged: false,
        });
      }

      // SEC-RULE-003: Suspicious Parent-Child Process Relationship
      if (p.ppid && procMap.has(p.ppid)) {
        const parent = procMap.get(p.ppid)!;
        const parentName = parent.name.toLowerCase();
        const childName = p.name.toLowerCase();

        if (this.officeBinaries.has(parentName) && this.scriptEngines.has(childName)) {
          alerts.push({
            id: `alert-chain-${p.pid}-${Date.now()}`,
            timestamp: Date.now(),
            severity: 'CRITICAL',
            category: 'PROCESS',
            ruleId: 'SEC-RULE-003',
            title: `Suspicious Process Spawn: ${parent.name} -> ${p.name}`,
            description: `Office application "${parent.name}" spawned command shell "${p.name}". This pattern frequently indicates macro-based initial access or exploitation.`,
            affectedResource: `PID ${p.pid} (${p.name})`,
            evidence: {
              childPid: p.pid,
              childName: p.name,
              parentPid: parent.pid,
              parentName: parent.name,
              commandLine: p.commandLine,
            },
            recommendation:
              'Immediately inspect process command-line arguments and consider terminating the child process tree.',
            isAcknowledged: false,
          });
        }
      }
    }

    // 2. Audit Network Connections for High-Risk Ports
    for (const conn of connections) {
      if (conn.state === 'LISTEN' && this.highRiskPorts.has(conn.localPort)) {
        alerts.push({
          id: `alert-port-${conn.localPort}-${Date.now()}`,
          timestamp: Date.now(),
          severity: 'HIGH',
          category: 'NETWORK',
          ruleId: 'SEC-RULE-004',
          title: `Sensitive listening port detected: :${conn.localPort}`,
          description: `Port ${conn.localPort} is actively in LISTEN state by PID ${conn.pid}. This port is frequently associated with reverse shells or Trojan backdoors.`,
          affectedResource: `Port ${conn.localPort}`,
          evidence: {
            port: conn.localPort,
            pid: conn.pid,
            protocol: conn.protocol,
            processName: conn.processName,
          },
          recommendation:
            'Identify the listening process and verify whether the service was deliberately configured.',
          isAcknowledged: false,
        });
      }
    }

    return alerts;
  }
}
