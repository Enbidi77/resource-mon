import { NativeLibraryLoader } from '../koffi/loader.js';
import { defaultLogger } from '@sentinel/logger';
import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import type { WindowsService, WindowsServiceStatusEnum, WindowsServiceStartupEnum } from '@sentinel/contracts';

const execFileAsync = promisify(execFile);

export class Advapi32Bridge {
  private adv32: any = null;
  private k32: any = null;
  private isElevatedCache: boolean | null = null;
  private cachedServices: WindowsService[] = [];
  private lastServicesQueryTime = 0;

  constructor() {
    const loader = NativeLibraryLoader.getInstance();
    if (!loader.isAvailable()) return;

    this.adv32 = loader.getLib('advapi32.dll');
    this.k32 = loader.getLib('kernel32.dll');
  }

  /**
   * Checks whether the current process is running with administrative elevation
   */
  public isProcessElevated(): boolean {
    if (this.isElevatedCache !== null) {
      return this.isElevatedCache;
    }

    if (process.platform !== 'win32') {
      this.isElevatedCache = process.getuid ? process.getuid() === 0 : false;
      return this.isElevatedCache;
    }

    try {
      if (this.adv32 && this.k32) {
        const GetCurrentProcess = this.k32.func('intptr_t __stdcall GetCurrentProcess()');
        const CloseHandle = this.k32.func('bool __stdcall CloseHandle(intptr_t hObject)');
        const OpenProcessToken = this.adv32.func(
          'bool __stdcall OpenProcessToken(intptr_t ProcessHandle, uint32 DesiredAccess, _Out_ intptr_t* TokenHandle)'
        );
        const GetTokenInformation = this.adv32.func(
          'bool __stdcall GetTokenInformation(intptr_t TokenHandle, int TokenInformationClass, _Out_ uint8_t* TokenInformation, uint32 TokenInformationLength, _Out_ uint32* ReturnLength)'
        );

        const TOKEN_QUERY = 0x0008;
        const TokenElevation = 20;
        const tokenBuf = [0];

        if (OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, tokenBuf)) {
          const elevBuf = Buffer.alloc(4);
          const retLen = [0];
          const ok = GetTokenInformation(tokenBuf[0], TokenElevation, elevBuf, 4, retLen);
          CloseHandle(tokenBuf[0]);
          if (ok) {
            this.isElevatedCache = elevBuf.readUInt32LE(0) !== 0;
            return this.isElevatedCache;
          }
        }
      }
    } catch (err) {
      defaultLogger.debug({ err }, 'Native elevation check failed, attempting fallback');
    }

    // Fallback: Check for elevated group SID (S-1-16-12288 = High Mandatory Level)
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
   * Queries Windows Services via fast PowerShell CIM
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
      const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024,
      });

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
   * Control service (start, stop, restart)
   */
  public async controlService(name: string, action: 'start' | 'stop' | 'restart'): Promise<{ success: boolean; error?: string }> {
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
