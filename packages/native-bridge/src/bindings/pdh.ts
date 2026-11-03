import koffi from 'koffi';
import { NativeLibraryLoader, promisifyKoffi } from '../koffi/loader.js';
import { defaultLogger } from '@sentinel/logger';

export interface Win32DiskIo {
  readBytesPerSec: number;
  writeBytesPerSec: number;
}

let cachedPdhCounterValueStruct: any = null;

export class PdhBridge {
  private pdh: any = null;

  // Synchronous handles
  private PdhOpenQueryWFn: any = null;
  private PdhAddEnglishCounterWFn: any = null;
  private PdhCollectQueryDataFn: any = null;
  private PdhGetFormattedCounterValueFn: any = null;
  private PdhCloseQueryFn: any = null;

  // Promisified asynchronous handles
  private PdhCollectQueryDataAsync: any = null;
  private PdhGetFormattedCounterValueAsync: any = null;
  private PdhCloseQueryAsync: any = null;

  private counterValueStruct: any = null;
  private hQuery: bigint[] = [0n];
  private hReadCounter: bigint[] = [0n];
  private hWriteCounter: bigint[] = [0n];
  private isInitialized = false;

  constructor() {
    const loader = NativeLibraryLoader.getInstance();
    if (!loader.isAvailable()) return;

    this.pdh = loader.getLib('pdh.dll');
    if (!this.pdh) return;

    try {
      if (!cachedPdhCounterValueStruct) {
        cachedPdhCounterValueStruct = koffi.struct('PDH_FMT_COUNTERVALUE', {
          CStatus: 'uint32',
          doubleValue: 'double',
        });
      }
      this.counterValueStruct = cachedPdhCounterValueStruct;

      this.PdhOpenQueryWFn = this.pdh.func(
        'int __stdcall PdhOpenQueryW(str16 szDataSource, uintptr_t dwUserData, _Out_ intptr_t* phQuery)'
      );
      this.PdhAddEnglishCounterWFn = this.pdh.func(
        'int __stdcall PdhAddEnglishCounterW(intptr_t hQuery, str16 szFullCounterPath, uintptr_t dwUserData, _Out_ intptr_t* phCounter)'
      );
      this.PdhCollectQueryDataFn = this.pdh.func(
        'int __stdcall PdhCollectQueryData(intptr_t hQuery)'
      );
      this.PdhGetFormattedCounterValueFn = this.pdh.func(
        'int __stdcall PdhGetFormattedCounterValue(intptr_t hCounter, uint32 dwFormat, _Out_ uint32* lpdwType, _Inout_ PDH_FMT_COUNTERVALUE* pValue)'
      );
      this.PdhCloseQueryFn = this.pdh.func(
        'int __stdcall PdhCloseQuery(intptr_t hQuery)'
      );

      // Bind asynchronous non-blocking versions using Koffi's .async and libuv thread pool
      this.PdhCollectQueryDataAsync = promisifyKoffi<number>(this.PdhCollectQueryDataFn);
      this.PdhGetFormattedCounterValueAsync = promisifyKoffi<number>(this.PdhGetFormattedCounterValueFn);
      this.PdhCloseQueryAsync = promisifyKoffi<number>(this.PdhCloseQueryFn);

      // Open PDH query and attach standard English physical disk throughput counters
      const openStatus = this.PdhOpenQueryWFn(null, 0n, this.hQuery);
      if (openStatus === 0 && this.hQuery[0]) {
        const readStatus = this.PdhAddEnglishCounterWFn(
          this.hQuery[0],
          '\\PhysicalDisk(_Total)\\Disk Read Bytes/sec',
          0n,
          this.hReadCounter
        );
        const writeStatus = this.PdhAddEnglishCounterWFn(
          this.hQuery[0],
          '\\PhysicalDisk(_Total)\\Disk Write Bytes/sec',
          0n,
          this.hWriteCounter
        );

        if (readStatus === 0 && writeStatus === 0) {
          // Prime query data for delta calculations
          this.PdhCollectQueryDataFn(this.hQuery[0]);
          this.isInitialized = true;
        } else {
          defaultLogger.warn(
            { readStatus, writeStatus },
            'Failed to add PhysicalDisk PDH counters'
          );
        }
      }
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to bind PDH functions for Disk I/O');
    }
  }

  /**
   * Asynchronously collects formatted disk I/O throughput metrics without blocking the event loop
   */
  public async getDiskIo(): Promise<Win32DiskIo> {
    if (!this.isInitialized || !this.hQuery[0]) {
      return { readBytesPerSec: 0, writeBytesPerSec: 0 };
    }

    try {
      if (!this.PdhCollectQueryDataAsync || !this.PdhGetFormattedCounterValueAsync) {
        return this.getDiskIoSync();
      }

      const collectStatus = await this.PdhCollectQueryDataAsync(this.hQuery[0]);
      if (collectStatus !== 0) {
        return { readBytesPerSec: 0, writeBytesPerSec: 0 };
      }

      const valRead = { CStatus: 0, doubleValue: 0.0 };
      const valWrite = { CStatus: 0, doubleValue: 0.0 };
      const dummyType = [0];

      // 0x00000200 = PDH_FMT_DOUBLE
      const [rStatus, wStatus] = await Promise.all([
        this.PdhGetFormattedCounterValueAsync(
          this.hReadCounter[0],
          0x00000200,
          dummyType,
          valRead
        ),
        this.PdhGetFormattedCounterValueAsync(
          this.hWriteCounter[0],
          0x00000200,
          dummyType,
          valWrite
        ),
      ]);

      const readBytes =
        rStatus === 0 && valRead.CStatus === 0 ? Math.max(0, Math.round(valRead.doubleValue || 0)) : 0;
      const writeBytes =
        wStatus === 0 && valWrite.CStatus === 0 ? Math.max(0, Math.round(valWrite.doubleValue || 0)) : 0;

      return {
        readBytesPerSec: readBytes,
        writeBytesPerSec: writeBytes,
      };
    } catch (err) {
      defaultLogger.debug({ err }, 'Error sampling PDH disk I/O asynchronously');
      return { readBytesPerSec: 0, writeBytesPerSec: 0 };
    }
  }

  /**
   * Synchronously samples PDH disk I/O
   */
  public getDiskIoSync(): Win32DiskIo {
    if (!this.isInitialized || !this.hQuery[0]) {
      return { readBytesPerSec: 0, writeBytesPerSec: 0 };
    }

    try {
      const collectStatus = this.PdhCollectQueryDataFn(this.hQuery[0]);
      if (collectStatus !== 0) {
        return { readBytesPerSec: 0, writeBytesPerSec: 0 };
      }

      const valRead = { CStatus: 0, doubleValue: 0.0 };
      const valWrite = { CStatus: 0, doubleValue: 0.0 };
      const dummyType = [0];

      // 0x00000200 = PDH_FMT_DOUBLE
      const rStatus = this.PdhGetFormattedCounterValueFn(
        this.hReadCounter[0],
        0x00000200,
        dummyType,
        valRead
      );
      const wStatus = this.PdhGetFormattedCounterValueFn(
        this.hWriteCounter[0],
        0x00000200,
        dummyType,
        valWrite
      );

      const readBytes =
        rStatus === 0 && valRead.CStatus === 0 ? Math.max(0, Math.round(valRead.doubleValue || 0)) : 0;
      const writeBytes =
        wStatus === 0 && valWrite.CStatus === 0 ? Math.max(0, Math.round(valWrite.doubleValue || 0)) : 0;

      return {
        readBytesPerSec: readBytes,
        writeBytesPerSec: writeBytes,
      };
    } catch (err) {
      defaultLogger.debug({ err }, 'Error sampling PDH disk I/O synchronously');
      return { readBytesPerSec: 0, writeBytesPerSec: 0 };
    }
  }

  public async dispose(): Promise<void> {
    if (this.hQuery[0] && this.PdhCloseQueryAsync) {
      try {
        await this.PdhCloseQueryAsync(this.hQuery[0]);
      } catch (err) {
        defaultLogger.debug({ err }, 'Error closing PDH query asynchronously');
      }
      this.hQuery[0] = 0n;
      this.isInitialized = false;
    } else if (this.hQuery[0] && this.PdhCloseQueryFn) {
      try {
        this.PdhCloseQueryFn(this.hQuery[0]);
      } catch (err) {
        defaultLogger.debug({ err }, 'Error closing PDH query');
      }
      this.hQuery[0] = 0n;
      this.isInitialized = false;
    }
  }
}
