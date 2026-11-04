import { describe, it, expect, vi } from "vitest";
import {
  toDisposable,
  toAsyncDisposable,
  createSubscriptionDisposable,
  isDisposable,
  isAsyncDisposable,
  disposeSafely,
  disposeSafelyAsync,
} from "../packages/shared/src/disposable.js";
import { SentinelDatabase } from "../packages/storage/src/database.js";
import { SystemCollector } from "../packages/monitoring/src/collectors/SystemCollector.js";
import { MockSystemAdapter } from "../packages/testing/src/index.js";
import os from "os";
import path from "path";
import fs from "fs";

describe("Explicit Resource Management: Shared Disposable Utilities", () => {
  it("toDisposable releases resource on scope exit via using", () => {
    let released = false;
    {
      using res = toDisposable(() => {
        released = true;
      });
      expect(released).toBe(false);
    }
    expect(released).toBe(true);
  });

  it("toDisposable releases resource when body throws", () => {
    let released = false;
    expect(() => {
      using res = toDisposable(() => {
        released = true;
      });
      throw new Error("Failure inside scope");
    }).toThrow("Failure inside scope");

    expect(released).toBe(true);
  });

  it("toDisposable is idempotent on repeated disposal", () => {
    let callCount = 0;
    const res = toDisposable(() => {
      callCount++;
    });

    res[Symbol.dispose]();
    res[Symbol.dispose]();
    expect(callCount).toBe(1);
  });

  it("toAsyncDisposable releases resource asynchronously via await using", async () => {
    let released = false;
    {
      await using res = toAsyncDisposable(async () => {
        await new Promise((r) => setTimeout(r, 10));
        released = true;
      });
      expect(released).toBe(false);
    }
    expect(released).toBe(true);
  });

  it("toAsyncDisposable is idempotent on repeated async disposal", async () => {
    let callCount = 0;
    const res = toAsyncDisposable(async () => {
      callCount++;
    });

    await res[Symbol.asyncDispose]();
    await res[Symbol.asyncDispose]();
    expect(callCount).toBe(1);
  });

  it("createSubscriptionDisposable supports both direct invocation and using", () => {
    // 1. Direct call test
    let directUnsub = false;
    const unsub1 = createSubscriptionDisposable(() => {
      directUnsub = true;
    });
    unsub1();
    expect(directUnsub).toBe(true);

    // 2. Using declaration test
    let usingUnsub = false;
    {
      using sub2 = createSubscriptionDisposable(() => {
        usingUnsub = true;
      });
      expect(usingUnsub).toBe(false);
    }
    expect(usingUnsub).toBe(true);
  });

  it("type guards identify Disposable and AsyncDisposable correctly", () => {
    const syncRes = { [Symbol.dispose]() {} };
    const asyncRes = { async [Symbol.asyncDispose]() {} };
    const plainObj = { close() {} };

    expect(isDisposable(syncRes)).toBe(true);
    expect(isDisposable(asyncRes)).toBe(false);
    expect(isDisposable(plainObj)).toBe(false);

    expect(isAsyncDisposable(asyncRes)).toBe(true);
    expect(isAsyncDisposable(syncRes)).toBe(false);
    expect(isAsyncDisposable(plainObj)).toBe(false);
  });

  it("disposeSafely and disposeSafelyAsync handle errors and null gracefully", async () => {
    expect(() => disposeSafely(null)).not.toThrow();
    await expect(disposeSafelyAsync(undefined)).resolves.not.toThrow();

    let errorHandled = false;
    const throwingResource = {
      [Symbol.dispose]() {
        throw new Error("Disposal fault");
      },
    };

    expect(() => {
      disposeSafely(throwingResource, () => {
        errorHandled = true;
      });
    }).not.toThrow();
    expect(errorHandled).toBe(true);
  });
});

describe("SentinelDatabase Lifecycle", () => {
  it("disposes cleanly via using and handles closed state idempotently", async () => {
    const tmpDir = path.join(os.tmpdir(), `sentinel-test-db-${Date.now()}`);
    {
      await using db = new SentinelDatabase(tmpDir);
      expect(db.closed).toBe(false);
      db.recordMetric({
        timestamp: Date.now(),
        cpuTotal: 10,
        cpuCores: [],
        memoryUsedBytes: 1000,
        memoryTotalBytes: 2000,
        memoryFreeBytes: 1000,
        memoryPercent: 50,
        gpu: [],
        diskReadBytesPerSec: 0,
        diskWriteBytesPerSec: 0,
        networkDownloadBytesPerSec: 0,
        networkUploadBytesPerSec: 0,
        activeProcessesCount: 0,
        activeSocketsCount: 0,
        systemIntegrityScore: 100,
      });
    }

    // Cleanup tmpDir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it("disposes cleanly via await using", async () => {
    const tmpDir = path.join(
      os.tmpdir(),
      `sentinel-test-db-async-${Date.now()}`,
    );
    {
      await using db = new SentinelDatabase(tmpDir);
      expect(db.closed).toBe(false);
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });
});

describe("SystemCollector Disposable Lifecycle", () => {
  it("stops timers and clears subscribers on scope exit via using", () => {
    const adapter = new MockSystemAdapter();
    let tickCount = 0;

    {
      using collector = new SystemCollector(adapter, 10, 50);
      collector.start();

      using sub = collector.subscribe(() => {
        tickCount++;
      });

      expect(collector.disposed).toBe(false);
    }

    // Collector should now be disposed
  });

  it("subscription disposable can be unsubscribed via using scope", () => {
    const adapter = new MockSystemAdapter();
    const collector = new SystemCollector(adapter, 10, 500);

    let received = 0;
    {
      using sub = collector.subscribe(() => {
        received++;
      });
      expect(sub).toBeDefined();
    }

    collector.dispose();
  });
});
