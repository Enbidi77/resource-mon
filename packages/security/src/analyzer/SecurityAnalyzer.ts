import { execFile } from "child_process";
import { promisify } from "util";
import {
  existsSync,
  openSync,
  readSync,
  closeSync,
  statSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { AuthenticodeVerifier } from "@sentinel/native-bridge";
import { defaultLogger } from "@sentinel/logger";
import type {
  HardeningCheck,
  UnquotedServiceFinding,
  ExposedPortFinding,
  PersistenceItem,
  BinaryAnalysisResult,
  SecurityAuditReport,
  WindowsService,
  NetworkConnection,
  ProcessInfo,
} from "@sentinel/contracts";

const execFileAsync = promisify(execFile);

export class SecurityAnalyzer {
  private verifier = new AuthenticodeVerifier();

  /**
   * Fast Shannon Entropy calculation for a binary (0.0 to 8.0)
   * High entropy (> 7.2) strongly indicates packed, encrypted, or obfuscated payloads.
   */
  public calculateEntropy(filePath: string): {
    entropy: number;
    isPacked: boolean;
    sizeBytes: number;
  } {
    if (!filePath || !existsSync(filePath)) {
      return { entropy: 0, isPacked: false, sizeBytes: 0 };
    }

    try {
      const stats = statSync(filePath);
      const sizeBytes = stats.size;
      if (sizeBytes === 0) {
        return { entropy: 0, isPacked: false, sizeBytes: 0 };
      }

      // Sample up to 1 MB for fast and accurate entropy calculation
      const sampleSize = Math.min(sizeBytes, 1024 * 1024);
      const buffer = Buffer.alloc(sampleSize);
      const fd = openSync(filePath, "r");
      try {
        readSync(fd, buffer, 0, sampleSize, 0);
      } finally {
        closeSync(fd);
      }

      const frequencies = new Uint32Array(256);
      for (let i = 0; i < sampleSize; i++) {
        frequencies[buffer[i]]++;
      }

      let entropy = 0;
      for (let i = 0; i < 256; i++) {
        if (frequencies[i] > 0) {
          const p = frequencies[i] / sampleSize;
          entropy -= p * Math.log2(p);
        }
      }

      const roundedEntropy = Math.round(entropy * 100) / 100;
      const isPacked = roundedEntropy >= 7.2 && sizeBytes > 16384;

      return {
        entropy: roundedEntropy,
        isPacked,
        sizeBytes,
      };
    } catch (err) {
      defaultLogger.debug({ err, filePath }, "Failed to compute entropy");
      return { entropy: 0, isPacked: false, sizeBytes: 0 };
    }
  }

  /**
   * Scans Windows services for unquoted service binary paths containing spaces (CWE-428)
   */
  public auditUnquotedServices(
    services: WindowsService[],
  ): UnquotedServiceFinding[] {
    const findings: UnquotedServiceFinding[] = [];

    for (const svc of services) {
      const binPath = (svc.binPath || "").trim();
      if (!binPath) continue;

      if (!binPath.startsWith('"')) {
        const exeIndex = binPath.toLowerCase().indexOf(".exe");
        if (exeIndex !== -1) {
          const pathPart = binPath.slice(0, exeIndex + 4);
          if (pathPart.includes(" ")) {
            const firstSpace = pathPart.indexOf(" ");
            const vulnerableSegment = `${pathPart.slice(0, firstSpace)}.exe`;

            findings.push({
              serviceName: svc.name,
              displayName: svc.displayName || svc.name,
              binPath,
              vulnerablePathSegment: vulnerableSegment,
            });
          }
        }
      }
    }

    return findings;
  }

  /**
   * Scans network listening ports for exposed high-risk protocols on external interfaces
   */
  public auditExposedPorts(
    connections: NetworkConnection[],
  ): ExposedPortFinding[] {
    const findings: ExposedPortFinding[] = [];
    const highRiskPorts: Record<
      number,
      { name: string; risk: "CRITICAL" | "HIGH" | "MEDIUM" }
    > = {
      21: { name: "FTP (Cleartext)", risk: "HIGH" },
      23: { name: "Telnet (Insecure)", risk: "CRITICAL" },
      135: { name: "MS-RPC Endpoint Mapper", risk: "HIGH" },
      445: { name: "SMB File Sharing", risk: "CRITICAL" },
      1433: { name: "MS SQL Server", risk: "HIGH" },
      3389: { name: "Remote Desktop (RDP)", risk: "HIGH" },
      4444: { name: "Metasploit Default Listener", risk: "CRITICAL" },
      5555: { name: "ADB / Android Debug Bridge", risk: "HIGH" },
      5985: { name: "WinRM HTTP", risk: "HIGH" },
      5986: { name: "WinRM HTTPS", risk: "MEDIUM" },
      1337: { name: "Suspicious Custom Port", risk: "CRITICAL" },
      31337: { name: "BackOrifice / Trojan Port", risk: "CRITICAL" },
    };

    for (const conn of connections) {
      if (conn.state === "LISTEN") {
        const addr = conn.localAddress;
        const isExternal = addr === "0.0.0.0" || addr === "::" || addr === "*";

        if (isExternal && highRiskPorts[conn.localPort]) {
          const meta = highRiskPorts[conn.localPort];
          findings.push({
            port: conn.localPort,
            protocol: conn.protocol,
            localAddress: conn.localAddress,
            serviceName: meta.name,
            pid: conn.pid,
            processName: conn.processName || "System / Unknown",
            risk: meta.risk,
          });
        }
      }
    }

    return findings;
  }

  /**
   * Scans Windows Autostart / Persistence mechanisms asynchronously
   */
  public async scanPersistence(): Promise<PersistenceItem[]> {
    const items: PersistenceItem[] = [];

    if (process.platform !== "win32") {
      return items;
    }

    // 1. Registry Run Keys (asynchronous, non-blocking)
    const registryLocations: Array<{
      key: string;
      source: PersistenceItem["source"];
    }> = [
      {
        key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        source: "REGISTRY_HKCU_RUN",
      },
      {
        key: "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        source: "REGISTRY_HKLM_RUN",
      },
      {
        key: "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
        source: "REGISTRY_RUNONCE",
      },
      {
        key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
        source: "REGISTRY_RUNONCE",
      },
    ];

    for (const loc of registryLocations) {
      try {
        const { stdout: output } = await execFileAsync(
          "reg.exe",
          ["query", loc.key],
          {
            encoding: "utf8",
            timeout: 2000,
          },
        );

        const lines = output.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("HKEY_")) continue;

          const parts = trimmed.split(/\s{2,}/);
          if (parts.length >= 3) {
            const name = parts[0];
            const rawData = parts.slice(2).join(" ");

            const { targetPath, args } =
              this.parseExecutableFromCommand(rawData);
            const exists = existsSync(targetPath);
            let isSigned: boolean | null = null;
            let publisher: string | null = null;
            let risk: PersistenceItem["risk"] = "BENIGN";

            if (exists) {
              const sig = await this.verifier.verifySignature(targetPath);
              isSigned = sig.status === "VALID";
              publisher = sig.signer || null;

              if (!isSigned) {
                risk =
                  targetPath.toLowerCase().includes("temp") ||
                  targetPath.toLowerCase().includes("appdata")
                    ? "SUSPICIOUS"
                    : "UNVERIFIED";
              }
            } else {
              risk = "UNVERIFIED";
            }

            items.push({
              id: `pers-${loc.source}-${name}`,
              name,
              source: loc.source,
              location: loc.key,
              targetPath,
              args,
              exists,
              isSigned,
              publisher,
              risk,
            });
          }
        }
      } catch (err) {
        defaultLogger.debug(
          { err, key: loc.key },
          "Could not read registry run key",
        );
      }
    }

    // 2. Startup Folders
    const startupFolders: Array<{
      path?: string;
      source: PersistenceItem["source"];
    }> = [
      {
        path: process.env.APPDATA
          ? join(
              process.env.APPDATA,
              "Microsoft",
              "Windows",
              "Start Menu",
              "Programs",
              "Startup",
            )
          : undefined,
        source: "STARTUP_FOLDER",
      },
      {
        path: process.env.ProgramData
          ? join(
              process.env.ProgramData,
              "Microsoft",
              "Windows",
              "Start Menu",
              "Programs",
              "Startup",
            )
          : undefined,
        source: "STARTUP_FOLDER",
      },
    ];

    for (const folder of startupFolders) {
      if (!folder.path || !existsSync(folder.path)) continue;

      try {
        const files = readdirSync(folder.path);
        for (const file of files) {
          if (file.toLowerCase() === "desktop.ini") continue;
          const fullPath = join(folder.path, file);
          const sig = await this.verifier.verifySignature(fullPath);
          const isSigned = sig.status === "VALID";

          items.push({
            id: `pers-startup-${file}`,
            name: file,
            source: folder.source,
            location: folder.path,
            targetPath: fullPath,
            args: "",
            exists: true,
            isSigned,
            publisher: sig.signer || null,
            risk: isSigned ? "BENIGN" : "SUSPICIOUS",
          });
        }
      } catch (err) {
        defaultLogger.debug(
          { err, path: folder.path },
          "Could not read startup folder",
        );
      }
    }

    return items;
  }

  /**
   * Runs CIS-inspired Windows Hardening checks asynchronously
   */
  public async auditHardening(
    services: WindowsService[],
    connections: NetworkConnection[],
    isAntivirusActive: boolean,
    isFirewallActive: boolean,
  ): Promise<HardeningCheck[]> {
    const checks: HardeningCheck[] = [];

    // 1. LSA Protection (RunAsPPL) - non-blocking async
    let lsaStatus: HardeningCheck["status"] = "FAIL";
    let lsaDetails =
      "LSA Protection (RunAsPPL) is not enabled. LSASS process memory is vulnerable to credential extraction.";
    if (process.platform === "win32") {
      try {
        const { stdout: out } = await execFileAsync(
          "reg.exe",
          [
            "query",
            "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa",
            "/v",
            "RunAsPPL",
          ],
          {
            encoding: "utf8",
            timeout: 2000,
          },
        );
        if (out.includes("0x1") || out.includes("0x2")) {
          lsaStatus = "PASS";
          lsaDetails =
            "LSA Protection (RunAsPPL) is active. LSASS runs as a protected process.";
        }
      } catch {
        // Key not present or error
      }
    } else {
      lsaStatus = "UNKNOWN";
      lsaDetails = "Not applicable on non-Windows platforms";
    }

    checks.push({
      id: "HARDEN-LSA-PPL",
      title: "LSA Credential Protection (RunAsPPL)",
      category: "IDENTITY",
      severity: "HIGH",
      status: lsaStatus,
      details: lsaDetails,
      recommendation:
        "Enable RunAsPPL in HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa to prevent credential dumping.",
    });

    // 2. User Account Control (UAC EnableLUA) - non-blocking async
    let uacStatus: HardeningCheck["status"] = "PASS";
    let uacDetails =
      "User Account Control (UAC) is active and enforcing administrator elevation prompts.";
    if (process.platform === "win32") {
      try {
        const { stdout: out } = await execFileAsync(
          "reg.exe",
          [
            "query",
            "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System",
            "/v",
            "EnableLUA",
          ],
          { encoding: "utf8", timeout: 2000 },
        );
        if (out.includes("0x0")) {
          uacStatus = "FAIL";
          uacDetails =
            "User Account Control (EnableLUA) is disabled. Applications execute with unprompted privileges.";
        }
      } catch {
        // Default pass
      }
    }

    checks.push({
      id: "HARDEN-UAC-LUA",
      title: "User Account Control (UAC)",
      category: "SYSTEM",
      severity: "CRITICAL",
      status: uacStatus,
      details: uacDetails,
      recommendation: "Ensure UAC EnableLUA is set to 1 in system policy.",
    });

    // 3. Antivirus Engine Protection
    checks.push({
      id: "HARDEN-AV-ACTIVE",
      title: "Real-Time Antivirus Protection",
      category: "SYSTEM",
      severity: "CRITICAL",
      status: isAntivirusActive ? "PASS" : "FAIL",
      details: isAntivirusActive
        ? "Real-time endpoint antivirus protection is actively engaged."
        : "No active antivirus protection engine reported by the security center.",
      recommendation:
        "Enable Windows Defender Real-time Protection or an enterprise EDR solution.",
    });

    // 4. Host Firewall Enforcement
    checks.push({
      id: "HARDEN-FW-ACTIVE",
      title: "Windows Firewall Enforcement",
      category: "NETWORK",
      severity: "CRITICAL",
      status: isFirewallActive ? "PASS" : "FAIL",
      details: isFirewallActive
        ? "Host firewall is active across network profiles."
        : "Windows Firewall is disabled or not reporting active profiles.",
      recommendation:
        "Enable Windows Firewall on Domain, Private, and Public profiles.",
    });

    // 5. Unquoted Service Path Vulnerabilities
    const unquoted = this.auditUnquotedServices(services);
    checks.push({
      id: "HARDEN-SVC-UNQUOTED",
      title: "Unquoted Service Binary Paths",
      category: "SERVICES",
      severity: "HIGH",
      status: unquoted.length === 0 ? "PASS" : "WARN",
      details:
        unquoted.length === 0
          ? "All installed Windows services use properly quoted executable paths."
          : `Discovered ${unquoted.length} service(s) with unquoted executable paths containing spaces (CWE-428).`,
      recommendation:
        "Enclose service binary paths containing spaces in quotation marks to prevent privilege escalation via binary planting.",
    });

    // 6. Dangerous Open Listening Ports
    const exposed = this.auditExposedPorts(connections);
    checks.push({
      id: "HARDEN-NET-EXPOSED-PORTS",
      title: "High-Risk Network Ports Exposed",
      category: "NETWORK",
      severity: "HIGH",
      status:
        exposed.length === 0
          ? "PASS"
          : exposed.some((p) => p.risk === "CRITICAL")
            ? "FAIL"
            : "WARN",
      details:
        exposed.length === 0
          ? "No high-risk listening ports (RDP, SMB, Telnet, WinRM) exposed on external interfaces."
          : `Found ${exposed.length} exposed listening port(s) on 0.0.0.0/:: (${exposed.map((e) => e.serviceName).join(", ")}).`,
      recommendation:
        "Bind administrative services to localhost (127.0.0.1) or restrict access via firewall rules.",
    });

    return checks;
  }

  /**
   * Conducts an on-demand forensic deep dive on a specific executable path or running PID
   */
  public async analyzeBinary(
    target: { filePath?: string; pid?: number },
    processes: ProcessInfo[] = [],
  ): Promise<BinaryAnalysisResult> {
    let resolvedPath = target.filePath || "";
    let targetName = target.filePath || "";

    if (target.pid) {
      const match = processes.find((p) => p.pid === target.pid);
      if (match) {
        resolvedPath = match.executablePath || "";
        targetName = match.name;
      }
    }

    const exists = resolvedPath && existsSync(resolvedPath);
    const { entropy, isPacked, sizeBytes } =
      this.calculateEntropy(resolvedPath);
    let authenticodeStatus = "UNAVAILABLE";
    let signer: string | null = null;
    let sha256: string | null = null;

    if (exists) {
      const sig = await this.verifier.verifySignature(resolvedPath);
      authenticodeStatus =
        sig.status === "VALID" ? "SIGNED_VERIFIED" : sig.status;
      signer = sig.signer || null;
      try {
        sha256 = await this.verifier.computeFileSha256(resolvedPath);
      } catch {
        // ignore hash failure
      }
    }

    // Assess risk factors
    const riskFactors: string[] = [];
    let riskScore = 0;

    if (isPacked) {
      riskFactors.push(
        `High Shannon entropy (${entropy}/8.0) strongly indicates packed or encrypted payload`,
      );
      riskScore += 35;
    }

    const lowerPath = resolvedPath.toLowerCase();
    if (lowerPath.includes("\\temp\\") || lowerPath.includes("/tmp/")) {
      riskFactors.push("Binary executes from a temporary storage directory");
      riskScore += 25;
    } else if (lowerPath.includes("\\appdata\\local\\")) {
      riskFactors.push("Binary executes from user-writable AppData location");
      riskScore += 10;
    }

    if (exists && authenticodeStatus !== "SIGNED_VERIFIED") {
      riskFactors.push(
        "Binary is unsigned or possesses an invalid Authenticode signature",
      );
      riskScore += 20;
    }

    const lolbins = [
      "powershell.exe",
      "cmd.exe",
      "mshta.exe",
      "certutil.exe",
      "cscript.exe",
      "wscript.exe",
    ];
    if (lolbins.some((b) => lowerPath.endsWith(b))) {
      riskFactors.push("High-risk system scripting interpreter / LOLBIN");
      riskScore += 15;
    }

    let riskLevel: BinaryAnalysisResult["riskLevel"] = "CLEAN";
    if (riskScore >= 60) riskLevel = "CRITICAL";
    else if (riskScore >= 40) riskLevel = "HIGH";
    else if (riskScore >= 20) riskLevel = "MEDIUM";
    else if (riskScore > 0) riskLevel = "LOW";

    return {
      target: targetName || resolvedPath || "Unknown Target",
      pid: target.pid || null,
      entropy,
      isPacked,
      authenticodeStatus,
      signer,
      sha256,
      sizeBytes,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      riskFactors,
      analyzedAt: Date.now(),
    };
  }

  /**
   * Conducts full automated security audit report asynchronously without blocking the event loop
   */
  public async runFullAudit(
    services: WindowsService[],
    connections: NetworkConnection[],
    processes: ProcessInfo[],
    isAntivirusActive: boolean,
    isFirewallActive: boolean,
  ): Promise<SecurityAuditReport> {
    const unquotedServices = this.auditUnquotedServices(services);
    const exposedPorts = this.auditExposedPorts(connections);
    const persistenceItems = await this.scanPersistence();
    const hardeningChecks = await this.auditHardening(
      services,
      connections,
      isAntivirusActive,
      isFirewallActive,
    );

    // Analyze top anomalous or elevated processes (e.g. unsigned or temp path)
    const anomalousProcs = processes
      .filter((p) => {
        const lp = (p.executablePath || "").toLowerCase();
        return lp.includes("temp") || lp.includes("appdata");
      })
      .slice(0, 5);

    const analyzedProcesses: BinaryAnalysisResult[] = [];
    for (const proc of anomalousProcs) {
      if (proc.executablePath) {
        const res = await this.analyzeBinary(
          { pid: proc.pid, filePath: proc.executablePath },
          processes,
        );
        analyzedProcesses.push(res);
      }
    }

    // Score calculation (0 - 100)
    let score = 100;
    for (const check of hardeningChecks) {
      if (check.status === "FAIL") score -= 15;
      else if (check.status === "WARN") score -= 8;
    }
    if (unquotedServices.length > 0)
      score -= Math.min(20, unquotedServices.length * 5);
    if (exposedPorts.length > 0) score -= Math.min(25, exposedPorts.length * 8);

    const suspiciousPersist = persistenceItems.filter(
      (p) => p.risk === "SUSPICIOUS",
    ).length;
    if (suspiciousPersist > 0) score -= Math.min(20, suspiciousPersist * 10);

    const finalScore = Math.max(10, Math.min(100, score));

    let statusLevel: SecurityAuditReport["statusLevel"] = "OPTIMAL";
    if (finalScore < 50) statusLevel = "COMPROMISED";
    else if (finalScore < 75) statusLevel = "GUARDED";
    else if (finalScore < 90) statusLevel = "ELEVATED";

    return {
      timestamp: Date.now(),
      overallAuditScore: finalScore,
      statusLevel,
      hardeningChecks,
      unquotedServices,
      exposedPorts,
      persistenceItems,
      analyzedProcesses,
    };
  }

  private parseExecutableFromCommand(cmd: string): {
    targetPath: string;
    args: string;
  } {
    let clean = cmd.trim();
    if (clean.startsWith('"')) {
      const closingQuote = clean.indexOf('"', 1);
      if (closingQuote !== -1) {
        return {
          targetPath: clean.slice(1, closingQuote),
          args: clean.slice(closingQuote + 1).trim(),
        };
      }
    }

    const exeMatch = clean.match(
      /^([a-zA-Z]:\\[^\s]+\.exe|\%[a-zA-Z]+\%\\[^\s]+\.exe)(.*)$/i,
    );
    if (exeMatch) {
      return {
        targetPath: this.expandEnvVars(exeMatch[1]),
        args: (exeMatch[2] || "").trim(),
      };
    }

    const firstSpace = clean.indexOf(" ");
    if (firstSpace !== -1) {
      return {
        targetPath: this.expandEnvVars(clean.slice(0, firstSpace)),
        args: clean.slice(firstSpace + 1).trim(),
      };
    }

    return { targetPath: this.expandEnvVars(clean), args: "" };
  }

  private expandEnvVars(pathStr: string): string {
    return pathStr.replace(/%([^%]+)%/g, (_, n) => process.env[n] || `%${n}%`);
  }
}
