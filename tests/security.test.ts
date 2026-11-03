import { describe, it, expect } from "vitest";
import { SecurityAnalyzer } from "../packages/security/src/analyzer/SecurityAnalyzer.js";
import {
  SecurityAuditReportSchema,
  BinaryAnalysisResultSchema,
  HardeningCheckSchema,
  UnquotedServiceFindingSchema,
} from "../packages/contracts/src/index.js";
import type {
  WindowsService,
  NetworkConnection,
} from "../packages/contracts/src/index.js";

describe("SecurityAnalyzer", () => {
  const analyzer = new SecurityAnalyzer();

  it("detects unquoted service binary paths with spaces (CWE-428)", () => {
    const services: WindowsService[] = [
      {
        name: "VulnerableService",
        displayName: "Vulnerable Corp Service",
        status: "RUNNING",
        startType: "AUTO",
        binPath: "C:\\Program Files\\My Application\\service.exe -k run",
      },
      {
        name: "SafeQuotedService",
        displayName: "Safe Quoted Service",
        status: "RUNNING",
        startType: "AUTO",
        binPath: '"C:\\Program Files\\My Application\\service.exe" -k run',
      },
      {
        name: "SafeNoSpaceService",
        displayName: "Safe No Space Service",
        status: "RUNNING",
        startType: "AUTO",
        binPath: "C:\\Windows\\System32\\svchost.exe",
      },
    ];

    const findings = analyzer.auditUnquotedServices(services);
    expect(findings.length).toBe(1);
    expect(findings[0].serviceName).toBe("VulnerableService");
    expect(findings[0].vulnerablePathSegment).toBe("C:\\Program.exe");

    const parsed = UnquotedServiceFindingSchema.safeParse(findings[0]);
    expect(parsed.success).toBe(true);
  });

  it("detects exposed high-risk network listening ports on 0.0.0.0", () => {
    const connections: NetworkConnection[] = [
      {
        protocol: "TCP",
        localAddress: "0.0.0.0",
        localPort: 3389,
        remoteAddress: "0.0.0.0",
        remotePort: 0,
        state: "LISTEN",
        pid: 1234,
        processName: "svchost.exe",
      },
      {
        protocol: "TCP",
        localAddress: "127.0.0.1",
        localPort: 3389,
        remoteAddress: "0.0.0.0",
        remotePort: 0,
        state: "LISTEN",
        pid: 1234,
        processName: "svchost.exe",
      },
      {
        protocol: "TCP",
        localAddress: "0.0.0.0",
        localPort: 8080,
        remoteAddress: "0.0.0.0",
        remotePort: 0,
        state: "LISTEN",
        pid: 5678,
        processName: "node.exe",
      },
    ];

    const findings = analyzer.auditExposedPorts(connections);
    expect(findings.length).toBe(1);
    expect(findings[0].port).toBe(3389);
    expect(findings[0].risk).toBe("HIGH");
    expect(findings[0].serviceName).toContain("RDP");
  });

  it("runs hardening checks and validates contract schemas", async () => {
    const checks = await analyzer.auditHardening([], [], true, true);
    expect(checks.length).toBeGreaterThanOrEqual(4);

    for (const check of checks) {
      const parsed = HardeningCheckSchema.safeParse(check);
      expect(parsed.success).toBe(true);
    }
  });

  it("generates a full audit report conforming to SecurityAuditReportSchema", async () => {
    const report = await analyzer.runFullAudit([], [], [], true, true);
    expect(report.overallAuditScore).toBeGreaterThanOrEqual(0);
    expect(report.overallAuditScore).toBeLessThanOrEqual(100);

    const parsed = SecurityAuditReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });
});
