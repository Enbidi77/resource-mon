import koffi from 'koffi';
import { defaultLogger } from '@sentinel/logger';

export const isWindows = process.platform === 'win32';

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

  public getLib(name: string): any {
    if (!this.available) return null;
    if (this.loadedLibs.has(name)) {
      return this.loadedLibs.get(name);
    }
    try {
      const lib = koffi.load(name);
      this.loadedLibs.set(name, lib);
      return lib;
    } catch (err) {
      defaultLogger.warn({ lib: name, err }, `Failed to load native library ${name}`);
      return null;
    }
  }
}

