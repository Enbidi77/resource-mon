import koffi from 'koffi';
import { NativeLibraryLoader } from '../koffi/loader.js';
import { defaultLogger } from '@sentinel/logger';

export interface Win32MemoryStatus {
  loadPercent: number;
  totalPhysBytes: number;
  availPhysBytes: number;
  totalPageFileBytes: number;
  availPageFileBytes: number;
  totalVirtualBytes: number;
  availVirtualBytes: number;
}

export interface Win32SystemTimes {
  idleTime: bigint;
  kernelTime: bigint;
  userTime: bigint;
}

export class Kernel32Bridge {
  private k32: any = null;
  private GetSystemTimesFn: any = null;
  private GlobalMemoryStatusExFn: any = null;
  private GetTickCount64Fn: any = null;
  private OpenProcessFn: any = null;
  private TerminateProcessFn: any = null;
  private CloseHandleFn: any = null;

  private memoryStatusExStruct: any = null;
  private fileTimeStruct: any = null;

  // Previous CPU times for delta calculation
  private prevTimes: { idle: bigint; kernel: bigint; user: bigint } | null = null;
  private lastCpuPercent = 0;

  constructor() {
    const loader = NativeLibraryLoader.getInstance();
    if (!loader.isAvailable()) return;

    this.k32 = loader.getLib('kernel32.dll');
    if (!this.k32) return;

    try {
      this.fileTimeStruct = koffi.struct('FILETIME', {
        dwLowDateTime: 'uint32',
        dwHighDateTime: 'uint32',
      });

      this.memoryStatusExStruct = koffi.struct('MEMORYSTATUSEX', {
        dwLength: 'uint32',
        dwMemoryLoad: 'uint32',
        ullTotalPhys: 'uint64',
        ullAvailPhys: 'uint64',
        ullTotalPageFile: 'uint64',
        ullAvailPageFile: 'uint64',
        ullTotalVirtual: 'uint64',
        ullAvailVirtual: 'uint64',
        ullAvailExtendedVirtual: 'uint64',
      });

      this.GetSystemTimesFn = this.k32.func(
        'bool __stdcall GetSystemTimes(_Out_ FILETIME* lpIdleTime, _Out_ FILETIME* lpKernelTime, _Out_ FILETIME* lpUserTime)'
      );
      this.GlobalMemoryStatusExFn = this.k32.func(
        'bool __stdcall GlobalMemoryStatusEx(_Inout_ MEMORYSTATUSEX* lpBuffer)'
      );
      this.GetTickCount64Fn = this.k32.func('uint64 __stdcall GetTickCount64()');
      this.OpenProcessFn = this.k32.func(
        'intptr_t __stdcall OpenProcess(uint32 dwDesiredAccess, bool bInheritHandle, uint32 dwProcessId)'
      );
      this.TerminateProcessFn = this.k32.func(
        'bool __stdcall TerminateProcess(intptr_t hProcess, uint32 uExitCode)'
      );
      this.CloseHandleFn = this.k32.func('bool __stdcall CloseHandle(intptr_t hObject)');
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to bind Kernel32 Win32 functions');
    }
  }

  public getMemoryStatus(): Win32MemoryStatus | null {
    if (!this.GlobalMemoryStatusExFn || !this.memoryStatusExStruct) return null;
    try {
      const mem: any = { dwLength: koffi.sizeof(this.memoryStatusExStruct) };
      const success = this.GlobalMemoryStatusExFn(mem);
      if (!success) return null;

      return {
        loadPercent: mem.dwMemoryLoad,
        totalPhysBytes: Number(mem.ullTotalPhys),
        availPhysBytes: Number(mem.ullAvailPhys),
        totalPageFileBytes: Number(mem.ullTotalPageFile),
        availPageFileBytes: Number(mem.ullAvailPageFile),
        totalVirtualBytes: Number(mem.ullTotalVirtual),
        availVirtualBytes: Number(mem.ullAvailVirtual),
      };
    } catch (err) {
      defaultLogger.debug({ err }, 'Error in GlobalMemoryStatusEx');
      return null;
    }
  }

  public getUptimeSeconds(): number {
    if (this.GetTickCount64Fn) {
      try {
        const ms = this.GetTickCount64Fn();
        return Number(ms) / 1000;
      } catch {
        return process.uptime();
      }
    }
    return process.uptime();
  }

  public getCpuTimes(): Win32SystemTimes | null {
    if (!this.GetSystemTimesFn) return null;
    try {
      const idle: any = {};
      const kernel: any = {};
      const user: any = {};
      const ok = this.GetSystemTimesFn(idle, kernel, user);
      if (!ok) return null;

      const toBigInt = (ft: any) =>
        (BigInt(ft.dwHighDateTime) << 32n) | BigInt(ft.dwLowDateTime);

      return {
        idleTime: toBigInt(idle),
        kernelTime: toBigInt(kernel),
        userTime: toBigInt(user),
      };
    } catch {
      return null;
    }
  }

  public calculateCpuUsagePercent(): number {
    const times = this.getCpuTimes();
    if (!times) return this.lastCpuPercent;

    if (!this.prevTimes) {
      this.prevTimes = {
        idle: times.idleTime,
        kernel: times.kernelTime,
        user: times.userTime,
      };
      return 0;
    }

    const idleDelta = times.idleTime - this.prevTimes.idle;
    const kernelDelta = times.kernelTime - this.prevTimes.kernel;
    const userDelta = times.userTime - this.prevTimes.user;

    this.prevTimes = {
      idle: times.idleTime,
      kernel: times.kernelTime,
      user: times.userTime,
    };

    const totalSystem = kernelDelta + userDelta;
    if (totalSystem <= 0n) return this.lastCpuPercent;

    // Kernel time includes idle time in Windows GetSystemTimes
    const busy = totalSystem - idleDelta;
    const percent = Math.max(0, Math.min(100, Number((busy * 10000n) / totalSystem) / 100));
    this.lastCpuPercent = percent;
    return percent;
  }

  public terminateProcess(pid: number): { success: boolean; error?: string } {
    if (!this.OpenProcessFn || !this.TerminateProcessFn || !this.CloseHandleFn) {
      return { success: false, error: 'Native Process API not available' };
    }

    const PROCESS_TERMINATE = 0x0001;
    let handle: any = null;
    try {
      handle = this.OpenProcessFn(PROCESS_TERMINATE, false, pid);
      if (!handle || handle === 0n || handle === 0) {
        return { success: false, error: `Access Denied or invalid PID ${pid}` };
      }
      const ok = this.TerminateProcessFn(handle, 1);
      return { success: Boolean(ok), error: ok ? undefined : 'TerminateProcess call failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    } finally {
      if (handle && handle !== 0n && handle !== 0) {
        this.CloseHandleFn(handle);
      }
    }
  }
}
