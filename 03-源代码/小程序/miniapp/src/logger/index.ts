type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = process.env.NODE_ENV === 'development';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = IS_DEV ? 'debug' : 'warn';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

function formatMessage(prefix: string, message: string): string {
  return `[${prefix}] ${message}`;
}

export const logger = {
  debug(prefix: string, message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(formatMessage(prefix, message), ...args);
    }
  },

  info(prefix: string, message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatMessage(prefix, message), ...args);
    }
  },

  warn(prefix: string, message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage(prefix, message), ...args);
    }
  },

  error(prefix: string, message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(formatMessage(prefix, message), ...args);
    }
  },
};
