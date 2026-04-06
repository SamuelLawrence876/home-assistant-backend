import type { Context } from 'aws-lambda';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  stage: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  service?: string;
  stage?: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private readonly service: string;
  private readonly stage: string;
  private readonly minLevel: number;
  private readonly persistentContext: Record<string, unknown>;

  constructor(options: LoggerOptions = {}) {
    this.service = options.service ?? process.env.SERVICE_NAME ?? 'unknown';
    this.stage = options.stage ?? process.env.STAGE ?? 'local';
    this.minLevel = LOG_LEVEL_RANK[this.resolveEnvLevel()];
    this.persistentContext = options.context ?? {};
  }

  private resolveEnvLevel(): LogLevel {
    const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
    return (raw in LOG_LEVEL_RANK ? raw : 'info') as LogLevel;
  }

  private emit(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    if (LOG_LEVEL_RANK[level] < this.minLevel) return;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      stage: this.stage,
      ...this.persistentContext,
      ...extra,
    };

    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(record));
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    this.emit('debug', message, extra);
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.emit('info', message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.emit('warn', message, extra);
  }

  error(message: string, errorOrExtra?: Error | Record<string, unknown>, extra?: Record<string, unknown>): void {
    if (errorOrExtra instanceof Error) {
      this.emit('error', message, {
        errorName: errorOrExtra.name,
        errorMessage: errorOrExtra.message,
        stack: errorOrExtra.stack,
        ...extra,
      });
    } else {
      this.emit('error', message, errorOrExtra);
    }
  }

  // Returns a new Logger that includes additional key-value pairs in every record.
  // Use this to attach per-request context (e.g. correlationId, userId).
  child(context: Record<string, unknown>): Logger {
    return new Logger({
      service: this.service,
      stage: this.stage,
      context: { ...this.persistentContext, ...context },
    });
  }

  // Convenience shorthand to attach standard Lambda context fields.
  // Call once at the top of each handler invocation.
  withLambdaContext(lambdaContext: Pick<Context, 'awsRequestId' | 'functionName'>): Logger {
    return this.child({
      requestId: lambdaContext.awsRequestId,
      functionName: lambdaContext.functionName,
    });
  }
}

export const logger = new Logger();
