import type { ISystemAdapter } from '@sentinel/system-adapter';
import type { SystemMetricsSnapshot } from '@sentinel/contracts';
import { RingBuffer } from '../history/RingBuffer.js';
import { defaultLogger } from '@sentinel/logger';

export class SystemCollector {
  private adapter: ISystemAdapter;
  private historyBuffer: RingBuffer<SystemMetricsSnapshot>;
  private subscribers: Set<(snapshot: SystemMetricsSnapshot) => void> = new Set();
  private intervalTimer: NodeJS.Timeout | null = null;
  private intervalMs: number;
  private isCollecting = false;

  constructor(adapter: ISystemAdapter, capacity: number = 60, intervalMs: number = 1000) {
    this.adapter = adapter;
    this.historyBuffer = new RingBuffer<SystemMetricsSnapshot>(capacity);
    this.intervalMs = intervalMs;
  }

  public start(): void {
    if (this.intervalTimer) return;
    defaultLogger.info({ intervalMs: this.intervalMs }, 'Starting SystemCollector timer');

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
      defaultLogger.info('Stopped SystemCollector timer');
    }
  }

  public setIntervalMs(newInterval: number): void {
    this.intervalMs = newInterval;
    if (this.intervalTimer) {
      this.stop();
      this.start();
    }
  }

  public subscribe(callback: (snapshot: SystemMetricsSnapshot) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
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

  private async tick(): Promise<void> {
    if (this.isCollecting) return; // Prevent overlapping runs
    this.isCollecting = true;

    try {
      const snapshot = await this.adapter.getMetricsSnapshot();
      this.historyBuffer.push(snapshot);

      for (const sub of this.subscribers) {
        try {
          sub(snapshot);
        } catch (err) {
          defaultLogger.error({ err }, 'Error in system metric subscriber');
        }
      }
    } catch (err) {
      defaultLogger.error({ err }, 'Error during SystemCollector tick');
    } finally {
      this.isCollecting = false;
    }
  }
}
