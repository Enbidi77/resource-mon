/**
 * Fixed-capacity circular buffer for low-overhead metric history.
 * Ideal for real-time charts without memory leaks or array re-allocations.
 */
export class RingBuffer<T> {
  private buffer: (T | null)[];
  private capacity: number;
  private head = 0;
  private size = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  public push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  public toArray(): T[] {
    const result: T[] = [];
    if (this.size === 0) return result;

    const start = (this.head - this.size + this.capacity) % this.capacity;
    for (let i = 0; i < this.size; i++) {
      const idx = (start + i) % this.capacity;
      const val = this.buffer[idx];
      if (val !== null) {
        result.push(val);
      }
    }
    return result;
  }

  public clear(): void {
    this.buffer = new Array(this.capacity).fill(null);
    this.head = 0;
    this.size = 0;
  }

  public length(): number {
    return this.size;
  }
}
