// src/core/transport.ts

import type { Transport, TransportConfig } from '../types/transport.js';
import type { FormattedLogEntry, LogLevel } from '../types/config.js';

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
    // Default implementation - do nothing
  }
}

export class TransportManager {
  private transports: Map<string, Transport> = new Map();

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

  async log(entry: FormattedLogEntry): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const transport of this.transports.values()) {
      if (!transport.shouldLog || transport.shouldLog(entry.level)) {
        const result = transport.log(entry);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }
}