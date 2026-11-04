import type { ISystemAdapter } from "@sentinel/system-adapter";
import type { SystemMetricsSnapshot } from "@sentinel/contracts";
import { RingBuffer } from "../history/RingBuffer.js";
import { defaultLogger } from "@sentinel/logger";
import {
  createSubscriptionDisposable,
  type SubscriptionDisposable,
} from "@sentinel/shared";

export class SystemCollector implements Disposable {
  private adapter: ISystemAdapter;
  private historyBuffer: RingBuffer<SystemMetricsSnapshot>;
  private subscribers: Set<(snapshot: SystemMetricsSnapshot) => void> =
    new Set();
  private intervalTimer: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private isCollecting = false;
  private isDisposed = false;

  constructor(
    adapter: ISystemAdapter,
    capacity: number = 60,
    intervalMs: number = 1000,
  ) {
    this.adapter = adapter;
    this.historyBuffer = new RingBuffer<SystemMetricsSnapshot>(capacity);
    this.intervalMs = intervalMs;
  }

  public get disposed(): boolean {
    return this.isDisposed;
  }

  public start(): void {
    if (this.isDisposed) {
      defaultLogger.warn("Attempted to start disposed SystemCollector");
      return;
    }
    if (this.isDisposed) {
      defaultLogger.warn("Attempted to start disposed SystemCollector");
      return;
    }
    if (this.intervalTimer) return;
    defaultLogger.info(
      { intervalMs: this.intervalMs },
      "Starting SystemCollector timer",
    );

    // Run first sample immediately
    this.tick();

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      defaultLogger.info("Stopped SystemCollector timer");
    }
  }

  public setIntervalMs(newInterval: number): void {
    if (this.isDisposed) return;
    this.intervalMs = newInterval;
    if (this.intervalTimer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Subscribes a listener to live metric snapshots.
   * Returns a hybrid SubscriptionDisposable which can be unsubscribed either
   * via standard callback invocation `unsub()` or via `using unsub = collector.subscribe(...)`.
   */
  public subscribe(
    callback: (snapshot: SystemMetricsSnapshot) => void,
  ): SubscriptionDisposable {
    if (this.isDisposed) {
      return createSubscriptionDisposable(() => {});
    }

    this.subscribers.add(callback);
    return createSubscriptionDisposable(() => {
      this.subscribers.delete(callback);
    });
  }

  public getHistory(): SystemMetricsSnapshot[] {
    return this.historyBuffer.toArray();
  }

  public async getLatestSnapshot(): Promise<SystemMetricsSnapshot> {
    const list = this.getHistory();
    if (list.length > 0) {
      return list[list.length - 1];
    }
    return this.adapter.getMetricsSnapshot();
  }

  /**
   * Synchronous Disposable interface implementation.
   * Cleans up active polling timers and clears all registered subscribers.
   */
  public [Symbol.dispose](): void {
    this.dispose();
  }

  /**
   * Public disposal method for manual or non-using cleanup.
   * Idempotent: repeated calls are safely ignored.
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.stop();
    this.subscribers.clear();
  }

  private async tick(): Promise<void> {
    if (this.isDisposed || this.isCollecting) return; // Prevent overlapping runs or tick after disposal
    this.isCollecting = true;

    try {
      const snapshot = await this.adapter.getMetricsSnapshot();
      if (this.isDisposed) return;

      this.historyBuffer.push(snapshot);

      for (const sub of this.subscribers) {
        try {
          sub(snapshot);
        } catch (err) {
          defaultLogger.error({ err }, "Error in system metric subscriber");
        }
      }
    } catch (err) {
      defaultLogger.error({ err }, "Error during SystemCollector tick");
    } finally {
      this.isCollecting = false;
    }
  }
}
