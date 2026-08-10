import type { Logger } from '../types/logger.js';

export interface RequestLike {
  method: string;
  url: string;
  headers: Map<string, string> | Headers | Record<string, string>;
  ip?: string;
  nextUrl?: {
    pathname: string;
  };
}

export interface NextJSLoggerOptions {
  includeRequestInfo?: boolean;
  includeUserAgent?: boolean;
  includeIP?: boolean;
  sanitizeHeaders?: boolean;
}

export class NextJSAdapter {
  private logger: Logger;
  private options: NextJSLoggerOptions;

  constructor(logger: Logger, options: NextJSLoggerOptions = {}) {
    this.logger = logger;
    this.options = {
      includeRequestInfo: true,
      includeUserAgent: false,
      includeIP: false,
      sanitizeHeaders: true,
      ...options,
    };
  }

  private getHeader(headers: RequestLike['headers'], name: string): string | null {
    if (headers instanceof Map) {
      return headers.get(name) || null;
    } else if (typeof headers === 'object' && 'get' in headers) {
      return (headers as Headers).get(name);
    } else {
      return (headers as Record<string, string>)[name] || null;
    }
  }

  private forEachHeader(headers: RequestLike['headers'], callback: (value: string, key: string) => void): void {
    if (headers instanceof Map) {
      headers.forEach(callback);
    } else if (typeof headers === 'object' && 'forEach' in headers) {
      (headers as Headers).forEach(callback);
    } else {
      Object.entries(headers as Record<string, string>).forEach(([key, value]) => {
        callback(value, key);
      });
    }
  }

  withRequest(request: RequestLike): Logger {
    if (!this.options.includeRequestInfo) {
      return this.logger;
    }

    const context: Record<string, any> = {
      method: request.method,
      url: request.url,
      pathname: request.nextUrl?.pathname,
    };

    if (this.options.includeUserAgent) {
      context.userAgent = this.getHeader(request.headers, 'user-agent');
    }

    if (this.options.includeIP) {
      context.ip = request.ip || this.getHeader(request.headers, 'x-forwarded-for') || this.getHeader(request.headers, 'x-real-ip');
    }

    if (this.options.sanitizeHeaders) {
      const sanitizedHeaders: Record<string, string> = {};
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

      this.forEachHeader(request.headers, (value: string, key: string) => {
        if (sensitiveHeaders.includes(key.toLowerCase())) {
          sanitizedHeaders[key] = '[REDACTED]';
        } else {
          sanitizedHeaders[key] = value;
        }
      });

      context.headers = sanitizedHeaders;
    }

    const requestId = this.getHeader(request.headers, 'x-request-id') ||
                     `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    context.requestId = requestId;

    return this.logger.withContext(context);
  }

  middleware() {
    return (request: RequestLike) => {
      const logger = this.withRequest(request);
      const startTime = performance.now();

      logger.info(`${request.method} ${request.nextUrl?.pathname} - Request started`);

      return {
        logger,
        onComplete: (status?: number, error?: Error) => {
          const duration = performance.now() - startTime;
          const context = {
            duration: `${duration.toFixed(2)}ms`,
            status: status || (error ? 500 : 200),
          };

          if (error) {
            logger.error(`${request.method} ${request.nextUrl?.pathname} - Request failed`, {
              ...context,
              error: error.message,
              stack: error.stack,
            });
          } else {
            logger.success(`${request.method} ${request.nextUrl?.pathname} - Request completed`, context);
          }
        },
      };
    };
  }

  withAPIRoute<T extends (...args: any[]) => any>(handler: T): T {
    return (async (...args: any[]) => {
      const [request] = args;
      const logger = this.withRequest(request);
      const startTime = performance.now();

      try {
        logger.info(`API Route: ${request.method} ${request.nextUrl?.pathname}`);

        const result = await handler(...args);

        const duration = performance.now() - startTime;
        logger.success(`API Route completed in ${duration.toFixed(2)}ms`);

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(`API Route failed after ${duration.toFixed(2)}ms`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    }) as T;
  }
}
