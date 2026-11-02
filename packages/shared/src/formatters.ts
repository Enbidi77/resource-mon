/**
 * Converts a byte value into human-readable representation (e.g. 1.25 GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return `${bytes} B`;
  const unit = sizes[Math.min(i, sizes.length - 1)];
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${unit}`;
}

/**
 * Formats bytes/sec into throughput speed (e.g. 4.2 MB/s)
 */
export function formatSpeed(bytesPerSec: number, decimals: number = 1): string {
  return `${formatBytes(bytesPerSec, decimals)}/s`;
}

/**
 * Formats a fraction or percentage into human-readable string (e.g. 42.5%)
 */
export function formatPercentage(val: number, decimals: number = 1): string {
  return `${val.toFixed(decimals)}%`;
}

/**
 * Formats uptime in seconds into "Xd Xh Xm Xs" or "Xh Xm"
 */
export function formatDuration(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}m`);
  if (s > 0 || (d === 0 && h === 0 && m === 0)) parts.push(`${s}s`);

  return parts.join(' ') || '0s';
}

/**
 * Formats frequency in MHz or GHz
 */
export function formatHertz(mhz: number): string {
  if (mhz >= 1000) {
    return `${(mhz / 1000).toFixed(2)} GHz`;
  }
  return `${Math.round(mhz)} MHz`;
}

/**
 * Formats a timestamp into standard ISO or localized date
 */
export function formatTimestamp(ts: number | string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Truncates a string to maxLength with an ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Safely parse JSON without throwing
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return fallback;
  }
}
