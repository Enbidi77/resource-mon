import koffi, { LibraryHandle } from 'koffi';
import { defaultLogger } from '@sentinel/logger';
import { promisify } from 'node:util';

export const isWindows = process.platform === 'win32';

/**
 * Promisifies a Koffi native bound function's `.async` method
 * allowing non-blocking execution across Node.js / libuv worker threads.
 */
export function promisifyKoffi<T = any>(koffiFunc: any): (...args: any[]) => Promise<T> {
  if (!koffiFunc || typeof koffiFunc.async !== 'function') {
    throw new Error('Provided function does not support Koffi async execution');
  }
  return promisify(koffiFunc.async);
}

export class NativeLibraryLoader {
  private static instance: NativeLibraryLoader;
  private loadedLibs: Map<string, any> = new Map();
  private available = false;

  private constructor() {
    this.available = isWindows;
  }

  public static getInstance(): NativeLibraryLoader {
    if (!NativeLibraryLoader.instance) {
      NativeLibraryLoader.instance = new NativeLibraryLoader();
    }
    return NativeLibraryLoader.instance;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public getLib(name: string): LibraryHandle | null {
    if (!this.available) return null;
    if (this.loadedLibs.has(name)) {
      return this.loadedLibs.get(name);
    }
    try {
      const lib = koffi.load(name);
      this.loadedLibs.set(name, lib);
      return lib;
    } catch (err) {
      defaultLogger.warn(
        { lib: name, err },
        `Failed to load native library ${name}`,
      );
      return null;
    }
  }
}
