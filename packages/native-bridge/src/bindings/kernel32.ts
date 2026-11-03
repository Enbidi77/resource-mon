import koffi from 'koffi';
import { NativeLibraryLoader, promisifyKoffi } from '../koffi/loader.js';
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

let cachedFileTimeStruct: any = null;
let cachedMemoryStatusExStruct: any = null;

export class Kernel32Bridge {
  private k32: any = null;

  // Synchronous native handles
  private GetSystemTimesFn: any = null;
  private GlobalMemoryStatusExFn: any = null;
  private GetTickCount64Fn: any = null;
  private OpenProcessFn: any = null;
  private TerminateProcessFn: any = null;
  private CloseHandleFn: any = null;

  // Promisified asynchronous handles
  private GetSystemTimesAsync: any = null;
  private GlobalMemoryStatusExAsync: any = null;
  private GetTickCount64Async: any = null;
  private OpenProcessAsync: any = null;
  private TerminateProcessAsync: any = null;
  private CloseHandleAsync: any = null;

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
      if (!cachedFileTimeStruct) {
        cachedFileTimeStruct = koffi.struct('FILETIME', {
          dwLowDateTime: 'uint32',
          dwHighDateTime: 'uint32',
        });
      }
      this.fileTimeStruct = cachedFileTimeStruct;

      if (!cachedMemoryStatusExStruct) {
        cachedMemoryStatusExStruct = koffi.struct('MEMORYSTATUSEX', {
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
      }
      this.memoryStatusExStruct = cachedMemoryStatusExStruct;

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

      // Bind asynchronous non-blocking versions using Koffi's .async and libuv thread pool
      this.GetSystemTimesAsync = promisifyKoffi<boolean>(this.GetSystemTimesFn);
      this.GlobalMemoryStatusExAsync = promisifyKoffi<boolean>(this.GlobalMemoryStatusExFn);
      this.GetTickCount64Async = promisifyKoffi<bigint | number>(this.GetTickCount64Fn);
      this.OpenProcessAsync = promisifyKoffi<any>(this.OpenProcessFn);
      this.TerminateProcessAsync = promisifyKoffi<boolean>(this.TerminateProcessFn);
      this.CloseHandleAsync = promisifyKoffi<boolean>(this.CloseHandleFn);
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to bind Kernel32 Win32 functions');
    }
  }

  /**
   * Non-blocking asynchronous query of Win32 memory status
   */
  public async getMemoryStatus(): Promise<Win32MemoryStatus | null> {
    if (!this.GlobalMemoryStatusExAsync || !this.memoryStatusExStruct) {
      return this.getMemoryStatusSync();
    }
    try {
      const mem: any = { dwLength: koffi.sizeof(this.memoryStatusExStruct) };
      const success = await this.GlobalMemoryStatusExAsync(mem);
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
      defaultLogger.debug({ err }, 'Error in async GlobalMemoryStatusEx');
      return null;
    }
  }

  public getMemoryStatusSync(): Win32MemoryStatus | null {
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
      defaultLogger.debug({ err }, 'Error in sync GlobalMemoryStatusEx');
      return null;
    }
  }

  /**
   * Non-blocking asynchronous query of system uptime in seconds
   */
  public async getUptimeSeconds(): Promise<number> {
    if (this.GetTickCount64Async) {
      try {
        const ms = await this.GetTickCount64Async();
        return Number(ms) / 1000;
      } catch {
        return process.uptime();
      }
    }
    return this.getUptimeSecondsSync();
  }

  public getUptimeSecondsSync(): number {
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

  /**
   * Non-blocking asynchronous query of CPU system times
   */
  public async getCpuTimes(): Promise<Win32SystemTimes | null> {
    if (!this.GetSystemTimesAsync) return this.getCpuTimesSync();
    try {
      const idle: any = {};
      const kernel: any = {};
      const user: any = {};
      const ok = await this.GetSystemTimesAsync(idle, kernel, user);
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

  public getCpuTimesSync(): Win32SystemTimes | null {
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

  /**
   * Non-blocking asynchronous calculation of CPU usage percent
   */
  public async calculateCpuUsagePercent(): Promise<number> {
    const times = await this.getCpuTimes();
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

  public calculateCpuUsagePercentSync(): number {
    const times = this.getCpuTimesSync();
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

    const busy = totalSystem - idleDelta;
    const percent = Math.max(0, Math.min(100, Number((busy * 10000n) / totalSystem) / 100));
    this.lastCpuPercent = percent;
    return percent;
  }

  /**
   * Non-blocking asynchronous termination of a target process
   */
  public async terminateProcess(pid: number): Promise<{ success: boolean; error?: string }> {
    if (!this.OpenProcessAsync || !this.TerminateProcessAsync || !this.CloseHandleAsync) {
      return this.terminateProcessSync(pid);
    }

    const PROCESS_TERMINATE = 0x0001;
    let handle: any = null;
    try {
      handle = await this.OpenProcessAsync(PROCESS_TERMINATE, false, pid);
      if (!handle || handle === 0n || handle === 0) {
        return { success: false, error: `Access Denied or invalid PID ${pid}` };
      }
      const ok = await this.TerminateProcessAsync(handle, 1);
      return { success: Boolean(ok), error: ok ? undefined : 'TerminateProcess call failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    } finally {
      if (handle && handle !== 0n && handle !== 0) {
        await this.CloseHandleAsync(handle).catch(() => {});
      }
    }
  }

  public terminateProcessSync(pid: number): { success: boolean; error?: string } {
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
