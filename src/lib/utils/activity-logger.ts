import { SYSTEM_CONSTANTS } from './constants';

interface ErrorLogContext {
  operation: string;
  timestamp?: string;
  user?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  user: string;
  activity?: string;
  message?: string;
  stack?: string;
  [key: string]: any;
}

export class ActivityLogger {
  private static readonly currentTime = SYSTEM_CONSTANTS.CURRENT_TIME;
  private static readonly currentUser = SYSTEM_CONSTANTS.CURRENT_USER;

  private static formatLogEntry(entry: LogEntry): void {
    const { timestamp, activity, message, stack, ...rest } = entry;
    const prefix = `[${timestamp}]`;
    const mainMessage = activity || message || 'LOG';

    if (typeof window !== 'undefined') {
      // Browser environment
      const logData = { ...rest, stack };
      console.group(prefix + ' ' + mainMessage);
      console.log('Details:', logData);
      console.groupEnd();
    } else {
      // Server environment
      console.log(`${prefix} ${mainMessage}: ${JSON.stringify(rest, null, 2)}`);
    }
  }

  static logActivity(activity: string, details: Record<string, any>): void {
    try {
      const logEntry = {
        timestamp: details.timestamp || this.currentTime,
        user: details.user || this.currentUser,
        activity,
        ...details
      };

      this.formatLogEntry(logEntry);
    } catch (error) {
      console.warn('Failed to log activity:', error instanceof Error ? error.message : String(error));
    }
  }

  static logError(error: Error | unknown, context: ErrorLogContext): void {
    try {
      const errorLog = {
        timestamp: context.timestamp || this.currentTime,
        user: context.user || this.currentUser,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...context
      };

      this.formatLogEntry(errorLog);
    } catch (loggingError) {
      // Fallback error logging
      console.warn('Logging error:', {
        originalError: error instanceof Error ? error.message : String(error),
        context
      });
    }
  }
}