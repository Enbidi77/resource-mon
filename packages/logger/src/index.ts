import pino from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export function createLogger(name: string, level: LogLevel = 'info') {
  return pino({
    name,
    level,
    base: {
      pid: process.pid,
      hostname: process.env.COMPUTERNAME || 'localhost',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export const defaultLogger = createLogger('sentinel');
