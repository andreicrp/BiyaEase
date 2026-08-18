type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  info(message: string, ...optionalParams: unknown[]): void {
    console.log(formatMessage('info', message), ...optionalParams);
  },
  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(formatMessage('warn', message), ...optionalParams);
  },
  error(message: string, ...optionalParams: unknown[]): void {
    console.error(formatMessage('error', message), ...optionalParams);
  },
  debug(message: string, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.debug(formatMessage('debug', message), ...optionalParams);
    }
  },
};
