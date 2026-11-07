import os from "os";
import si from "systeminformation";
import type { ISystemAdapter } from "../interfaces/ISystemAdapter.js";
import {
  Kernel32Bridge,
  Advapi32Bridge,
  AuthenticodeVerifier,
  PdhBridge,
} from "@sentinel/native-bridge";
import { defaultLogger } from "@sentinel/logger";
import type {
  SystemOverview,
  SystemMetricsSnapshot,
  ProcessInfo,
  ProcessDetail,
  NetworkConnection,
  NetworkInterface,
  WindowsService,
  HardwareSummary,
} from "@sentinel/contracts";

export class WindowsSystemAdapter
  implements ISystemAdapter, Disposable, AsyncDisposable
{
  private kernel32 = new Kernel32Bridge();
  private advapi32 = new Advapi32Bridge();
  private verifier = new AuthenticodeVerifier();
  private pdh = new PdhBridge();

  private cachedOverview: SystemOverview | null = null;
  private cachedHardwareSummary: HardwareSummary | null = null;
  private hardwareSummaryPromise: Promise<HardwareSummary> | null = null;

  // High-frequency telemetry cache (< 5ms tick)
  private prevCpuCores: { idle: number; total: number }[] | null = null;
  private cachedGpuMetrics: {
    model: string;
    loadPercent: number;
    memoryUsedBytes: number;
    memoryTotalBytes: number;
    temperatureC: number | null;
  }[] = [];
  private lastGpuFetchTime = 0;
  private isFetchingGpu = false;

  private cachedNetRx = 0;
  private cachedNetTx = 0;
  private lastNetFetchTime = 0;
  private isFetchingNet = false;

  private cachedProcessesCount = 0;
  private cachedSocketsCount = 0;
  private lastProcFetchTime = 0;
  private isFetchingProcCounts = false;

  private calculateCoreLoads(): { coreIndex: number; loadPercent: number }[] {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) {
      return [{ coreIndex: 0, loadPercent: 0 }];
    }
    if (!this.prevCpuCores || this.prevCpuCores.length !== cpus.length) {
      this.prevCpuCores = cpus.map((c) => {
        const total =
          c.times.user +
          c.times.nice +
          c.times.sys +
          c.times.idle +
          c.times.irq;
        return { idle: c.times.idle, total };
      });
      return cpus.map((_, idx) => ({ coreIndex: idx, loadPercent: 0 }));
    }
    return cpus.map((c, idx) => {
      const total =
        c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq;
      const prev = this.prevCpuCores![idx];
      const totalDelta = total - prev.total;
      const idleDelta = c.times.idle - prev.idle;
      this.prevCpuCores![idx] = { idle: c.times.idle, total };
      if (totalDelta <= 0) return { coreIndex: idx, loadPercent: 0 };
      const busy = Math.max(0, totalDelta - idleDelta);
      const percent = Math.min(
        100,
        Math.round((busy / totalDelta) * 1000) / 10,
      );
      return { coreIndex: idx, loadPercent: percent };
    });
  }

  private updateGpuMetricsInBackground(): void {
    const now = Date.now();
    if (
      this.isFetchingGpu ||
      (this.cachedGpuMetrics.length > 0 && now - this.lastGpuFetchTime < 10000)
    ) {
      return;
    }
    this.isFetchingGpu = true;
    si.graphics()
      .then((graphics) => {
        this.cachedGpuMetrics =
          graphics?.controllers?.map((g) => ({
            model: g.model || "Display Adapter",
            loadPercent: g.utilizationGpu ?? 0,
            memoryUsedBytes: (g.memoryUsed ?? 0) * 1024 * 1024,
            memoryTotalBytes: (g.memoryTotal ?? 1024) * 1024 * 1024,
            temperatureC: g.temperatureGpu ?? null,
          })) || [];
        this.lastGpuFetchTime = Date.now();
      })
      .catch(() => {})
      .finally(() => {
        this.isFetchingGpu = false;
      });
  }

  private updateNetworkStatsInBackground(): void {
    const now = Date.now();
    if (this.isFetchingNet || now - this.lastNetFetchTime < 1000) {
      return;
    }
    this.isFetchingNet = true;
    si.networkStats()
      .then((networkStats) => {
        if (networkStats && Array.isArray(networkStats)) {
          let rx = 0;
          let tx = 0;
          for (const stat of networkStats) {
            rx += stat.rx_sec || 0;
            tx += stat.tx_sec || 0;
          }
          this.cachedNetRx = rx;
          this.cachedNetTx = tx;
        }
        this.lastNetFetchTime = Date.now();
      })
      .catch(() => {})
      .finally(() => {
        this.isFetchingNet = false;
      });
  }

  private updateProcessCountsInBackground(): void {
    const now = Date.now();
    // Throttle fallback queries to 20 seconds to prevent heap churn & CPU spikes
    if (
      this.isFetchingProcCounts ||
      (this.cachedProcessesCount > 0 && now - this.lastProcFetchTime < 20000)
    ) {
      return;
    }
    this.isFetchingProcCounts = true;
    Promise.all([
      si.processes().catch(() => null),
      si.networkConnections().catch(() => null),
    ])
      .then(([procs, conns]) => {
        if (procs) {
          this.cachedProcessesCount = procs.all || procs.list?.length || 0;
        }
        if (conns && Array.isArray(conns)) {
          this.cachedSocketsCount = conns.length;
        }
        this.lastProcFetchTime = Date.now();
      })
      .catch(() => {})
      .finally(() => {
        this.isFetchingProcCounts = false;
      });
  }

  private criticalProcessNames = new Set([
    "system",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
    "winlogon.exe",
    "explorer.exe",
    "svchost.exe",
  ]);

  public async getOverview(): Promise<SystemOverview> {
    if (this.cachedOverview) {
      const uptime = await this.kernel32.getUptimeSeconds();
      return {
        ...this.cachedOverview,
        uptimeSeconds: Math.floor(uptime),
      };
    }

    try {
      const [osInfo, cpu, mem, uptimeSecRaw, isElevated] = await Promise.all([
        si.osInfo(),
        si.cpu(),
        si.mem(),
        this.kernel32.getUptimeSeconds(),
        this.advapi32.isProcessElevated(),
      ]);

      const uptimeSec = Math.floor(uptimeSecRaw);
      const bootDate = new Date(Date.now() - uptimeSec * 1000).toISOString();

      this.cachedOverview = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        osName: osInfo.distro || "Microsoft Windows",
        osRelease: osInfo.release || os.release(),
        osBuild: osInfo.build || "",
        uptimeSeconds: uptimeSec,
        bootTime: bootDate,
        cpuBrand: cpu.brand || os.cpus()[0]?.model || "Generic Processor",
        cpuCores: cpu.cores || os.cpus().length,
        cpuPhysicalCores: cpu.physicalCores || cpu.cores || os.cpus().length,
        cpuBaseSpeedGhz: cpu.speed || 2.5,
        totalMemoryBytes: mem.total || os.totalmem(),
        isElevated,
        sentinelVersion: "1.0.0",
      };

      return this.cachedOverview;
    } catch (err) {
      defaultLogger.warn(
        { err },
        "Error building system overview; using fallback",
      );
      const [uptimeSecRaw, isElevated] = await Promise.all([
        this.kernel32.getUptimeSeconds(),
        this.advapi32.isProcessElevated(),
      ]);
      const uptimeSec = Math.floor(uptimeSecRaw);
      return {
        hostname: os.hostname(),
        platform: "win32",
        arch: os.arch(),
        osName: "Microsoft Windows",
        osRelease: os.release(),
        uptimeSeconds: uptimeSec,
        bootTime: new Date(Date.now() - uptimeSec * 1000).toISOString(),
        cpuBrand: os.cpus()[0]?.model || "Generic Processor",
        cpuCores: os.cpus().length,
        cpuPhysicalCores: os.cpus().length,
        cpuBaseSpeedGhz: (os.cpus()[0]?.speed || 2500) / 1000,
        totalMemoryBytes: os.totalmem(),
        isElevated,
        sentinelVersion: "1.0.0",
      };
    }
  }

  public async getMetricsSnapshot(): Promise<SystemMetricsSnapshot> {
    const timestamp = Date.now();

    // Parallel ultra-fast Win32 C FFI queries (< 1ms total)
    const [nativeMem, nativeCpu, diskIo] = await Promise.all([
      this.kernel32.getMemoryStatus(),
      this.kernel32.calculateCpuUsagePercent(),
      this.pdh.getDiskIo(),
    ]);

    // Use zero-allocation native PDH counts if available from pdh.dll
    if (diskIo.processesCount !== undefined) {
      this.cachedProcessesCount = diskIo.processesCount;
    }
    if (diskIo.activeSocketsCount !== undefined) {
      this.cachedSocketsCount = diskIo.activeSocketsCount;
    }

    // Trigger non-blocking background telemetry updates
    this.updateGpuMetricsInBackground();
    this.updateNetworkStatsInBackground();
    // Only invoke heavy systeminformation process enumeration if native PDH counter was unavailable
    if (
      diskIo.processesCount === undefined ||
      diskIo.activeSocketsCount === undefined
    ) {
      this.updateProcessCountsInBackground();
    }

    // Fast per-core load calculation using os.cpus() (1-2ms)
    const cpuTotal = nativeCpu;
    const cpuCores = this.calculateCoreLoads();

    // Memory calculations
    const totalMem = nativeMem ? nativeMem.totalPhysBytes : os.totalmem();
    const freeMem = nativeMem ? nativeMem.availPhysBytes : os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = nativeMem
      ? nativeMem.loadPercent
      : Math.round((usedMem / totalMem) * 100);

    // Fast Native Win32 PDH Disk I/O Throughput (Read/Write bytes per sec)
    const diskRead = diskIo.readBytesPerSec;
    const diskWrite = diskIo.writeBytesPerSec;

    // Network throughput from latest background sample
    const netRx = this.cachedNetRx;
    const netTx = this.cachedNetTx;

    // GPU metrics from background cache
    const gpuMetrics = this.cachedGpuMetrics;

    // System Integrity Score calculation (0-100)
    let integrity = 100;
    if (cpuTotal > 85) integrity -= 15;
    else if (cpuTotal > 70) integrity -= 5;

    if (memPercent > 90) integrity -= 20;
    else if (memPercent > 75) integrity -= 10;

    return {
      timestamp,
      cpuTotal: Math.round(cpuTotal * 10) / 10,
      cpuCores,
      memoryUsedBytes: usedMem,
      memoryTotalBytes: totalMem,
      memoryFreeBytes: freeMem,
      memoryPercent: memPercent,
      gpu: gpuMetrics,
      diskReadBytesPerSec: diskRead,
      diskWriteBytesPerSec: diskWrite,
      networkDownloadBytesPerSec: netRx,
      networkUploadBytesPerSec: netTx,
      activeProcessesCount: this.cachedProcessesCount,
      activeSocketsCount: this.cachedSocketsCount,
      systemIntegrityScore: Math.max(20, integrity),
    };
  }

  public async getProcesses(): Promise<ProcessInfo[]> {
    try {
      const data = await si.processes();
      const list = data.list || [];

      return list.map((p) => {
        const isCritical = this.criticalProcessNames.has(p.name.toLowerCase());
        return {
          pid: p.pid,
          ppid: p.parentPid || null,
          name: p.name,
          cpuPercent: Math.round(p.cpu * 10) / 10,
          memoryBytes: (p.memRss || 0) * 1024,
          memoryWorkingSetBytes: (p.memRss || 0) * 1024,
          memoryPercent: Math.round(p.mem * 10) / 10,
          executablePath: p.path || null,
          commandLine: p.command
            ? p.command.length > 512
              ? `${p.command.slice(0, 512)}...`
              : p.command
            : null,
          user: p.user || null,
          startTime: p.started || null,
          status: p.state || "running",
          isCriticalSystem: isCritical,
          signatureStatus: "UNCHECKED" as const,
        };
      });
    } catch (err) {
      defaultLogger.error({ err }, "Failed to enumerate Windows processes");
      return [];
    }
  }

  public async getProcessDetails(pid: number): Promise<ProcessDetail | null> {
    try {
      const procs = await this.getProcesses();
      const target = procs.find((p) => p.pid === pid);
      if (!target) return null;

      // Check signature if executable path exists
      let signatureStatus: any = "UNCHECKED";
      let signatureSigner: string | null = null;
      let sha256: string | null = null;

      if (target.executablePath) {
        const [sig, sha256Val] = await Promise.all([
          this.verifier.verifySignature(target.executablePath),
          this.verifier.computeFileSha256(target.executablePath),
        ]);
        signatureStatus = sig.status;
        signatureSigner = sig.signer || null;
        sha256 = sha256Val;
      }

      const parentProc = target.ppid
        ? procs.find((p) => p.pid === target.ppid)
        : null;
      const children = procs.filter((p) => p.ppid === pid).map((p) => p.pid);

      return {
        ...target,
        parentName: parentProc?.name || null,
        children,
        signatureStatus,
        signatureSigner,
        sha256,
      };
    } catch (err) {
      defaultLogger.error({ err, pid }, "Failed to get process details");
      return null;
    }
  }

  public async controlProcess(
    pid: number,
    action: "terminate" | "suspend" | "resume",
  ): Promise<boolean> {
    try {
      if (action === "terminate") {
        const res = await this.kernel32.terminateProcess(pid);
        return res.success;
      }
      return false;
    } catch (err) {
      defaultLogger.error({ err, pid, action }, "Failed to control process");
      return false;
    }
  }

  public async getNetworkConnections(): Promise<NetworkConnection[]> {
    try {
      const conns = await si.networkConnections();
      const list = Array.isArray(conns) ? conns.slice(0, 500) : [];
      return list.map((c, idx) => ({
        id: `conn-${idx}-${c.pid}-${c.localPort}-${c.peerPort}`,
        protocol: (c.protocol || "TCP").toUpperCase() as "TCP" | "UDP",
        localAddress: c.localAddress || "0.0.0.0",
        localPort: Number(c.localPort) || 0,
        remoteAddress: c.peerAddress || null,
        remotePort: c.peerPort ? Number(c.peerPort) : null,
        state: (c.state || "UNKNOWN").toUpperCase() as any,
        pid: c.pid || 0,
        processName: c.process || undefined,
      }));
    } catch (err) {
      defaultLogger.error({ err }, "Failed to query network connections");
      return [];
    }
  }

  public async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    try {
      const [ifaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats().catch(() => []),
      ]);

      const ifaceList = Array.isArray(ifaces) ? ifaces : [ifaces];
      const statsList = Array.isArray(stats) ? stats : [stats];

      return ifaceList.map((iface) => {
        const st = statsList.find((s) => s.iface === iface.iface);
        return {
          iface: iface.iface,
          ifaceName: iface.ifaceName || iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          internal: iface.internal,
          virtual: iface.virtual,
          operstate: iface.operstate,
          type: iface.type,
          speedMbps: iface.speed,
          rxBytes: st?.rx_bytes || 0,
          txBytes: st?.tx_bytes || 0,
          rxSec: st?.rx_sec || 0,
          txSec: st?.tx_sec || 0,
        };
      });
    } catch (err) {
      defaultLogger.warn({ err }, "Failed to get network interfaces");
      return [];
    }
  }

  public async getServices(): Promise<WindowsService[]> {
    return this.advapi32.queryWindowsServices();
  }

  public async getHardwareSummary(): Promise<HardwareSummary> {
    if (this.cachedHardwareSummary) {
      return this.cachedHardwareSummary;
    }

    if (this.hardwareSummaryPromise) {
      return this.hardwareSummaryPromise;
    }

    this.hardwareSummaryPromise = (async () => {
      try {
        const [
          cpu,
          mem,
          memLayout,
          graphics,
          diskLayout,
          fsSize,
          netIfaces,
          sys,
          bios,
          baseboard,
          battery,
        ] = await Promise.all([
          si.cpu().catch(() => null),
          si.mem().catch(() => null),
          si.memLayout().catch(() => []),
          si.graphics().catch(() => null),
          si.diskLayout().catch(() => []),
          si.fsSize().catch(() => []),
          si.networkInterfaces().catch(() => []),
          si.system().catch(() => null),
          si.bios().catch(() => null),
          si.baseboard().catch(() => null),
          si.battery().catch(() => null),
        ]);

        const ifaceList = Array.isArray(netIfaces) ? netIfaces : [netIfaces];

        // Ensure physical disks list is resiliently constructed
        let diskList =
          Array.isArray(diskLayout) && diskLayout.length > 0
            ? diskLayout.map((d) => ({
                name: d.name || d.device || "Storage Disk Drive",
                type: d.type || "SSD",
                sizeBytes: d.size || 0,
                interfaceType: d.interfaceType || "NVMe",
                smartStatus: d.smartStatus || "Ok",
              }))
            : [];

        if (diskList.length === 0) {
          const blockDevs = await si.blockDevices().catch(() => []);
          if (Array.isArray(blockDevs) && blockDevs.length > 0) {
            diskList = blockDevs.map((bd) => ({
              name: bd.name
                ? `${bd.name} Storage Drive`
                : "Primary Physical Drive",
              type: "Fixed Disk",
              sizeBytes: Number(bd.size) || 0,
              interfaceType: bd.protocol || "NVMe",
              smartStatus: "Ok",
            }));
          }
        }

        if (
          diskList.length === 0 &&
          Array.isArray(fsSize) &&
          fsSize.length > 0
        ) {
          const totalSize = fsSize.reduce((acc, f) => acc + (f.size || 0), 0);
          diskList.push({
            name: "System NVMe/SSD Storage Drive",
            type: "Fixed Disk",
            sizeBytes: totalSize,
            interfaceType: "NVMe",
            smartStatus: "Ok",
          });
        }

        // Map partitions/volumes
        const partitions = (Array.isArray(fsSize) ? fsSize : []).map((f) => ({
          fs: f.fs || f.mount || "C:",
          type: f.type || "NTFS",
          sizeBytes: f.size || 0,
          usedBytes: f.used || 0,
          availableBytes: f.available || 0,
          usePercent: f.use || 0,
          mount: f.mount || f.fs,
        }));

        const summary: HardwareSummary = {
          cpu: {
            manufacturer: cpu?.manufacturer || "Generic",
            brand: cpu?.brand || os.cpus()[0]?.model || "Processor",
            speedGhz: cpu?.speed || 2.5,
            cores: cpu?.cores || os.cpus().length,
            physicalCores: cpu?.physicalCores || cpu?.cores || os.cpus().length,
            socket: cpu?.socket || undefined,
            virtualization: cpu?.virtualization,
          },
          memory: {
            totalBytes: mem?.total || os.totalmem(),
            layout: (memLayout || []).map((m) => ({
              sizeBytes: m.size || 0,
              bank: m.bank,
              type: m.type,
              clockSpeedMhz: m.clockSpeed ?? undefined,
              partNum: m.partNum,
            })),
          },
          gpus: (graphics?.controllers || []).map((g) => ({
            vendor: g.vendor || "Unknown",
            model: g.model || "Display Adapter",
            vramMb: g.vram ?? undefined,
            driverVersion: g.driverVersion,
          })),
          disks: diskList,
          partitions,
          networkAdapters: ifaceList.filter(Boolean).map((n) => ({
            name: n.ifaceName || n.iface || "Ethernet",
            mac: n.mac || "00:00:00:00:00:00",
            speedMbps: n.speed,
            type: n.type,
          })),
          system: {
            manufacturer: sys?.manufacturer || "PC System",
            model: sys?.model || "Computer",
            version: sys?.version,
            serial: sys?.serial,
          },
          bios: {
            vendor: bios?.vendor || "System BIOS",
            version: bios?.version || "1.0",
            releaseDate: bios?.releaseDate,
          },
          baseboard: {
            manufacturer: baseboard?.manufacturer || "System Board",
            model: baseboard?.model || "BaseBoard",
            version: baseboard?.version,
          },
          battery: battery?.hasBattery
            ? {
                hasBattery: true,
                isCharging: battery.isCharging,
                percent: battery.percent,
              }
            : undefined,
        };

        this.cachedHardwareSummary = summary;
        return summary;
      } catch (err) {
        defaultLogger.error(
          { err },
          "Failed to build hardware summary; using safe fallback",
        );
        const fallback: HardwareSummary = {
          cpu: {
            manufacturer: "Generic",
            brand: os.cpus()[0]?.model || "Processor",
            speedGhz: 2.5,
            cores: os.cpus().length,
            physicalCores: os.cpus().length,
          },
          memory: { totalBytes: os.totalmem(), layout: [] },
          gpus: [],
          disks: [
            {
              name: "System NVMe Storage Drive",
              type: "SSD",
              sizeBytes: 512 * 1024 * 1024 * 1024,
              interfaceType: "NVMe",
              smartStatus: "Ok",
            },
          ],
          partitions: [],
          networkAdapters: [],
          system: { manufacturer: "PC System", model: "Computer" },
          bios: { vendor: "System BIOS", version: "1.0" },
          baseboard: { manufacturer: "System Board", model: "BaseBoard" },
        };
        this.cachedHardwareSummary = fallback;
        return fallback;
      } finally {
        this.hardwareSummaryPromise = null;
      }
    })();

    return this.hardwareSummaryPromise;
  }

  /**
   * Deterministically trims unused physical RAM pages from the working set
   */
  public trimWorkingSet(): boolean {
    return this.kernel32.trimWorkingSet();
  }

  /**
   * Deterministically closes native handles such as PDH query sessions.
   */
  public dispose(): void {
    if (this.pdh) {
      this.pdh[Symbol.dispose]();
    }
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    if (this.pdh) {
      await this.pdh[Symbol.asyncDispose]();
    }
  }
}
