/**
 * Structured Logger with PII Redaction
 * For observability and debugging
 */

import { redactAll, redactSensitiveFields } from '../privacy/redaction';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: any;
}

/**
 * Structured logger class
 */
class Logger {
  private appName: string = 'JNX-OS';

  /**
   * Log a message at a specific level
   */
  private log(level: LogLevel, message: string, context?: any, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: redactAll(message),
      context: context ? redactSensitiveFields(context) : undefined,
      error: error ? this.formatError(error) : undefined,
    };

    // In development, log to console with colors
    if (process.env.NODE_ENV === 'development') {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
      };

      const reset = '\x1b[0m';
      const color = colors[level];

      console.log(
        `${color}[${entry.timestamp}] [${level.toUpperCase()}]${reset} ${entry.message}`
      );

      if (entry.context) {
        console.log('Context:', entry.context);
      }

      if (entry.error) {
        console.error('Error:', entry.error);
      }
    } else {
      // In production, log as JSON (for log aggregation services)
      console.log(JSON.stringify(entry));
    }

    // TODO: Send to external logging service (e.g., Sentry, LogRocket, Datadog)
  }

  /**
   * Format error object for logging
   */
  private formatError(error: any) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: redactAll(error.message),
        stack: error.stack,
      };
    }
    return redactSensitiveFields(error);
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: any, context?: any) {
    this.log('error', message, context, error);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, userId?: string) {
    this.info(`API Request: ${method} ${path}`, { userId });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, status: number, duration: number) {
    this.info(`API Response: ${method} ${path} - ${status}`, { duration });
  }

  /**
   * Log auth event
   */
  authEvent(event: string, userId?: string, success: boolean = true) {
    this.info(`Auth Event: ${event}`, { userId, success });
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration: number) {
    this.debug(`DB Query: ${query}`, { duration });
  }
}

// Export singleton instance
export const logger = new Logger();
