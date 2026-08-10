import type { Transport, TransportConfig } from '../types/transport.js';
import type { FormattedLogEntry, LogErrorHandler, LogLevel } from '../types/config.js';

export abstract class BaseTransport implements Transport {
  protected config: TransportConfig;

  constructor(config: TransportConfig) {
    this.config = config;
  }

  get name(): string {
    return this.config.name;
  }

  abstract log(entry: FormattedLogEntry): void | Promise<void>;

  shouldLog(level: LogLevel): boolean {
    if (this.config.silent) return false;
    if (!this.config.level || this.config.level.length === 0) return true;
    return this.config.level.includes(level);
  }

  configure(config: Partial<TransportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  close(): void | Promise<void> {
  }

  /** Reports a delivery failure through `onError`, or to the console. */
  protected reportError(error: unknown): void {
    if (this.config.onError) {
      this.config.onError(error, this.name);
      return;
    }
    console.error(`Plip: transport "${this.name}" failed:`, error);
  }
}

export class TransportManager {
  private transports: Map<string, Transport> = new Map();
  private inFlight: Set<Promise<unknown>> = new Set();

  addTransport(transport: Transport): void {
    this.transports.set(transport.name, transport);
  }

  removeTransport(name: string): boolean {
    const transport = this.transports.get(name);
    if (transport && transport.close) {
      transport.close();
    }
    return this.transports.delete(name);
  }

  clearTransports(): void {
    for (const transport of this.transports.values()) {
      if (transport.close) {
        transport.close();
      }
    }
    this.transports.clear();
  }

  getTransports(): Transport[] {
    return Array.from(this.transports.values());
  }

  getTransport(name: string): Transport | undefined {
    return this.transports.get(name);
  }

  async log(entry: FormattedLogEntry, onError?: LogErrorHandler): Promise<void> {
    const promises: Promise<unknown>[] = [];

    for (const transport of this.transports.values()) {
      if (transport.shouldLog && !transport.shouldLog(entry.level)) continue;

      // One failing transport must not stop the others, and it must not fail
      // silently either: every rejection reaches `onError`.
      try {
        const result = transport.log(entry);
        if (result instanceof Promise) {
          promises.push(this.track(result.catch(error => this.report(error, transport.name, onError))));
        }
      } catch (error) {
        this.report(error, transport.name, onError);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /** Resolves once every transport has drained its pending work. */
  async flush(): Promise<void> {
    await Promise.all(Array.from(this.inFlight));

    const flushes = this.getTransports()
      .filter((transport): transport is Transport & { flush: () => void | Promise<void> } =>
        typeof transport.flush === 'function')
      .map(transport => Promise.resolve(transport.flush()).catch(error =>
        this.report(error, transport.name)));

    await Promise.all(flushes);
  }

  private track<T>(promise: Promise<T>): Promise<T> {
    this.inFlight.add(promise);
    void promise.finally(() => this.inFlight.delete(promise));
    return promise;
  }

  private report(error: unknown, transportName: string, onError?: LogErrorHandler): void {
    if (onError) {
      onError(error, transportName);
      return;
    }
    console.error(`Plip: transport "${transportName}" failed:`, error);
  }
}
