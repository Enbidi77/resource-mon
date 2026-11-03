import { NativeLibraryLoader, promisifyKoffi } from '../koffi/loader.js';
import { defaultLogger } from '@sentinel/logger';
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import type {
  WindowsService,
  WindowsServiceStatusEnum,
  WindowsServiceStartupEnum,
} from '@sentinel/contracts';

const execFileAsync = promisify(execFile);

export class Advapi32Bridge {
  private adv32: any = null;
  private k32: any = null;

  private GetCurrentProcessFn: any = null;
  private CloseHandleFn: any = null;
  private OpenProcessTokenFn: any = null;
  private GetTokenInformationFn: any = null;

  private OpenProcessTokenAsync: any = null;
  private GetTokenInformationAsync: any = null;
  private CloseHandleAsync: any = null;

  private isElevatedCache: boolean | null = null;
  private cachedServices: WindowsService[] = [];
  private lastServicesQueryTime = 0;

  constructor() {
    const loader = NativeLibraryLoader.getInstance();
    if (!loader.isAvailable()) return;

    this.adv32 = loader.getLib('advapi32.dll');
    this.k32 = loader.getLib('kernel32.dll');

    if (this.adv32 && this.k32) {
      try {
        /**
         * Win32 GetCurrentProcess (kernel32.dll)
         * Returns a pseudo-handle for the current process ((HANDLE)-1).
         * This pseudo-handle has maximum possible access to the process object
         * and does not need to be closed via CloseHandle.
         */
        this.GetCurrentProcessFn = this.k32.func('intptr_t __stdcall GetCurrentProcess()');

        /**
         * Win32 CloseHandle (kernel32.dll)
         * Closes the open access token handle to prevent handle leakage.
         */
        this.CloseHandleFn = this.k32.func('bool __stdcall CloseHandle(intptr_t hObject)');

        /**
         * Win32 OpenProcessToken (advapi32.dll)
         * Opens the access token associated with a process for querying security information.
         * @param ProcessHandle - Handle to the process whose token is being opened.
         * @param DesiredAccess - Requested access mask (e.g. 0x0008 for TOKEN_QUERY).
         * @param TokenHandle - [Out] Pointer to receive the handle identifying the opened token.
         * @returns Boolean true on success, false on failure.
         */
        this.OpenProcessTokenFn = this.adv32.func(
          'bool __stdcall OpenProcessToken(intptr_t ProcessHandle, uint32 DesiredAccess, _Out_ intptr_t* TokenHandle)'
        );

        /**
         * Win32 GetTokenInformation (advapi32.dll)
         * Queries detailed security information from an access token.
         * We pass TokenElevation (class 20) to inspect the TOKEN_ELEVATION struct:
         * struct TOKEN_ELEVATION { DWORD TokenIsElevated; };
         * A non-zero value indicates the process is executing with elevated administrator privileges.
         * @param TokenHandle - Handle to the queried access token.
         * @param TokenInformationClass - Information class enum (20 = TokenElevation).
         * @param TokenInformation - [Out] Buffer receiving the queried struct.
         * @param TokenInformationLength - Size in bytes of output buffer (4 bytes for uint32).
         * @param ReturnLength - [Out] Pointer to receive the actual byte count returned.
         * @returns Boolean true on success, false on failure.
         */
        this.GetTokenInformationFn = this.adv32.func(
          'bool __stdcall GetTokenInformation(intptr_t TokenHandle, int TokenInformationClass, _Out_ uint8_t* TokenInformation, uint32 TokenInformationLength, _Out_ uint32* ReturnLength)'
        );

        // Promisified asynchronous non-blocking versions:
        // Offloads native token security queries to libuv worker threads via Koffi's .async.
        this.OpenProcessTokenAsync = promisifyKoffi<boolean>(this.OpenProcessTokenFn);
        this.GetTokenInformationAsync = promisifyKoffi<boolean>(this.GetTokenInformationFn);
        this.CloseHandleAsync = promisifyKoffi<boolean>(this.CloseHandleFn);
      } catch (err) {
        defaultLogger.warn({ err }, 'Failed to bind Advapi32 native elevation functions');
      }
    }
  }

  /**
   * Asynchronously checks whether the current process is running with administrative elevation
   */
  public async isProcessElevated(): Promise<boolean> {
    if (this.isElevatedCache !== null) {
      return this.isElevatedCache;
    }

    if (process.platform !== 'win32') {
      this.isElevatedCache = process.getuid ? process.getuid() === 0 : false;
      return this.isElevatedCache;
    }

    try {
      if (
        this.OpenProcessTokenAsync &&
        this.GetTokenInformationAsync &&
        this.GetCurrentProcessFn &&
        this.CloseHandleAsync
      ) {
        const TOKEN_QUERY = 0x0008;
        const TokenElevation = 20;
        const tokenBuf = [0];

        const opened = await this.OpenProcessTokenAsync(
          this.GetCurrentProcessFn(),
          TOKEN_QUERY,
          tokenBuf
        );

        if (opened && tokenBuf[0]) {
          const elevBuf = Buffer.alloc(4);
          const retLen = [0];
          const ok = await this.GetTokenInformationAsync(
            tokenBuf[0],
            TokenElevation,
            elevBuf,
            4,
            retLen
          );
          await this.CloseHandleAsync(tokenBuf[0]).catch(() => {});
          if (ok) {
            this.isElevatedCache = elevBuf.readUInt32LE(0) !== 0;
            return this.isElevatedCache;
          }
        }
      }
    } catch (err) {
      defaultLogger.debug({ err }, 'Native async elevation check failed, attempting fallback');
    }

    // Fallback: Check for elevated group SID asynchronously
    try {
      const { stdout: out } = await execFileAsync('whoami.exe', ['/groups'], { encoding: 'utf8' });
      this.isElevatedCache = out.includes('S-1-16-12288') || out.includes('High Mandatory Level');
      return this.isElevatedCache;
    } catch {
      this.isElevatedCache = false;
      return false;
    }
  }

  /**
   * Synchronous check for process elevation
   */
  public isProcessElevatedSync(): boolean {
    if (this.isElevatedCache !== null) {
      return this.isElevatedCache;
    }

    if (process.platform !== 'win32') {
      this.isElevatedCache = process.getuid ? process.getuid() === 0 : false;
      return this.isElevatedCache;
    }

    try {
      if (
        this.OpenProcessTokenFn &&
        this.GetTokenInformationFn &&
        this.GetCurrentProcessFn &&
        this.CloseHandleFn
      ) {
        const TOKEN_QUERY = 0x0008;
        const TokenElevation = 20;
        const tokenBuf = [0];

        if (this.OpenProcessTokenFn(this.GetCurrentProcessFn(), TOKEN_QUERY, tokenBuf)) {
          const elevBuf = Buffer.alloc(4);
          const retLen = [0];
          const ok = this.GetTokenInformationFn(tokenBuf[0], TokenElevation, elevBuf, 4, retLen);
          this.CloseHandleFn(tokenBuf[0]);
          if (ok) {
            this.isElevatedCache = elevBuf.readUInt32LE(0) !== 0;
            return this.isElevatedCache;
          }
        }
      }
    } catch (err) {
      defaultLogger.debug({ err }, 'Native sync elevation check failed');
    }

    try {
      const out = execFileSync('whoami.exe', ['/groups'], { encoding: 'utf8' });
      this.isElevatedCache = out.includes('S-1-16-12288') || out.includes('High Mandatory Level');
      return this.isElevatedCache;
    } catch {
      this.isElevatedCache = false;
      return false;
    }
  }

  /**
   * Queries Windows Services via fast PowerShell CIM asynchronously
   */
  public async queryWindowsServices(): Promise<WindowsService[]> {
    if (process.platform !== 'win32') return [];

    const now = Date.now();
    if (this.cachedServices.length > 0 && now - this.lastServicesQueryTime < 10000) {
      return this.cachedServices;
    }

    try {
      const psScript = `
        Get-CimInstance Win32_Service | Select-Object -Property Name, DisplayName, State, StartMode, Description, PathName, StartName, ProcessId -First 120 | ConvertTo-Json -Compress
      `;
      const { stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', psScript],
        {
          encoding: 'utf8',
          timeout: 5000,
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      if (!stdout || !stdout.trim()) return [];
      const parsed = JSON.parse(stdout);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      this.cachedServices = items.map((svc: any): WindowsService => {
        let status: any = 'UNKNOWN';
        const st = (svc.State || '').toLowerCase();
        if (st === 'running') status = 'RUNNING';
        else if (st === 'stopped') status = 'STOPPED';
        else if (st === 'paused') status = 'PAUSED';
        else if (st === 'start pending') status = 'START_PENDING';
        else if (st === 'stop pending') status = 'STOP_PENDING';

        let startupType: any = 'UNKNOWN';
        const sm = (svc.StartMode || '').toLowerCase();
        if (sm === 'auto') startupType = 'AUTOMATIC';
        else if (sm === 'manual') startupType = 'MANUAL';
        else if (sm === 'disabled') startupType = 'DISABLED';

        return {
          name: svc.Name || 'Unknown',
          displayName: svc.DisplayName || svc.Name || 'Unknown',
          status,
          startupType,
          description: svc.Description || '',
          binPath: svc.PathName || '',
          serviceAccount: svc.StartName || 'LocalSystem',
          pid: svc.ProcessId ? Number(svc.ProcessId) : undefined,
        };
      });
      this.lastServicesQueryTime = now;
      return this.cachedServices;
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to query Windows services');
      return [];
    }
  }

  /**
   * Control service asynchronously (start, stop, restart)
   */
  public async controlService(
    name: string,
    action: 'start' | 'stop' | 'restart'
  ): Promise<{ success: boolean; error?: string }> {
    if (process.platform !== 'win32') {
      return { success: false, error: 'Services control only supported on Windows' };
    }

    try {
      let command = '';
      if (action === 'start') command = `Start-Service -Name '${name}'`;
      else if (action === 'stop') command = `Stop-Service -Name '${name}' -Force`;
      else if (action === 'restart') command = `Restart-Service -Name '${name}' -Force`;

      await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
        encoding: 'utf8',
        timeout: 10000,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }
}
