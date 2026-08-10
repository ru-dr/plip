import type { BrowserTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';

interface StoredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

const DEFAULT_STORAGE_KEY = 'plip-logs';
const DEFAULT_MAX_STORAGE_SIZE = 1024 * 1024;

export class BrowserTransport extends BaseTransport {
  private storage: Storage | null = null;

  constructor(config: BrowserTransportConfig) {
    super(config);

    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && config.useLocalStorage) {
      this.storage = (globalThis as any).localStorage;
    }
  }

  log(entry: FormattedLogEntry): void {
    const config = this.config as BrowserTransportConfig;

    if (config.enableConsoleGroup && entry.context && Object.keys(entry.context).length > 0) {
      console.group(`${entry.level.toUpperCase()}: ${entry.message}`);
      console.log('Context:', entry.context);
      if (entry.requestId) {
        console.log('Request ID:', entry.requestId);
      }
      console.groupEnd();
    } else {
      console.log(entry.formattedMessage);
    }

    if (this.storage && config.useLocalStorage) {
      this.storeInLocalStorage(entry, config);
    }
  }

  private storeInLocalStorage(entry: FormattedLogEntry, config: BrowserTransportConfig): void {
    if (!this.storage) return;

    const storageKey = config.storageKey || DEFAULT_STORAGE_KEY;
    const maxSize = config.maxStorageSize || DEFAULT_MAX_STORAGE_SIZE;

    try {
      const existing = this.storage.getItem(storageKey);
      const logs: StoredLogEntry[] = existing ? JSON.parse(existing) : [];

      logs.push({
        timestamp: entry.timestamp.toISOString(),
        level: entry.level,
        message: entry.message,
        context: entry.context,
        requestId: entry.requestId,
      });

      // Estimate each entry's serialized cost once and drop the oldest until
      // the budget is met, instead of re-stringifying the whole array per drop.
      const sizes = logs.map(log => JSON.stringify(log).length + 1);
      let total = sizes.reduce((sum, size) => sum + size, 0) + 1;
      let start = 0;
      while (total > maxSize && start < logs.length - 1) {
        total -= sizes[start]!;
        start++;
      }

      this.storage.setItem(storageKey, JSON.stringify(start > 0 ? logs.slice(start) : logs));
    } catch (error) {
      this.reportError(error);
    }
  }

  getLogs(): StoredLogEntry[] {
    if (!this.storage) return [];

    const config = this.config as BrowserTransportConfig;
    const storageKey = config.storageKey || DEFAULT_STORAGE_KEY;

    try {
      const logs = this.storage.getItem(storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      this.reportError(error);
      return [];
    }
  }

  clearLogs(): void {
    if (!this.storage) return;

    const config = this.config as BrowserTransportConfig;
    const storageKey = config.storageKey || DEFAULT_STORAGE_KEY;

    try {
      this.storage.removeItem(storageKey);
    } catch (error) {
      this.reportError(error);
    }
  }
}
