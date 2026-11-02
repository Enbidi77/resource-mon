import type { ISystemAdapter } from '../interfaces/ISystemAdapter.js';
import { WindowsSystemAdapter } from '../windows/WindowsSystemAdapter.js';
import { LinuxSystemAdapter } from '../linux/LinuxSystemAdapter.js';
import { DarwinSystemAdapter } from '../darwin/DarwinSystemAdapter.js';
import { defaultLogger } from '@sentinel/logger';

export class AdapterFactory {
  private static instance: ISystemAdapter | null = null;

  public static getAdapter(): ISystemAdapter {
    if (this.instance) {
      return this.instance;
    }

    const platform = process.platform;
    defaultLogger.info({ platform }, 'Initializing platform system adapter');

    if (platform === 'win32') {
      this.instance = new WindowsSystemAdapter();
    } else if (platform === 'darwin') {
      this.instance = new DarwinSystemAdapter();
    } else {
      this.instance = new LinuxSystemAdapter();
    }

    return this.instance;
  }
}
