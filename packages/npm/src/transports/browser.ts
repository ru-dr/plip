// src/transports/browser.ts

import type { BrowserTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';
import { JsonFormatter } from '../formatters/json.js';

export class BrowserTransport extends BaseTransport {
  private formatter: JsonFormatter;
  private storage: Storage | null = null;

  constructor(config: BrowserTransportConfig) {
    super(config);
    
    this.formatter = new JsonFormatter({
      includeTimestamp: true,
      includeLevel: true,
      includeMessage: true,
      includeContext: true,
      includeRequestId: true,
      pretty: false,
    });

    // Initialize storage if in browser environment
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && config.useLocalStorage) {
      this.storage = (globalThis as any).localStorage;
    }
  }

  log(entry: FormattedLogEntry): void {
    const config = this.config as BrowserTransportConfig;
    
    // Enhanced console logging with grouping
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

    // Store in localStorage if enabled
    if (this.storage && config.useLocalStorage) {
      this.storeInLocalStorage(entry, config);
    }
  }

  private storeInLocalStorage(entry: FormattedLogEntry, config: BrowserTransportConfig): void {
    if (!this.storage) return;

    const storageKey = config.storageKey || 'plip-logs';
    const maxSize = config.maxStorageSize || 1024 * 1024; // 1MB default
    
    try {
      // Get existing logs
      const existingLogs = this.storage.getItem(storageKey);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log entry
      const logEntry = {
        timestamp: entry.timestamp.toISOString(),
        level: entry.level,
        message: entry.message,
        context: entry.context,
        requestId: entry.requestId,
      };
      
      logs.push(logEntry);
      
      // Check size and trim if necessary
      let logsString = JSON.stringify(logs);
      while (logsString.length > maxSize && logs.length > 0) {
        logs.shift(); // Remove oldest log
        logsString = JSON.stringify(logs);
      }
      
      this.storage.setItem(storageKey, logsString);
    } catch (error) {
      // Storage might be full or disabled
      console.warn('BrowserTransport: Failed to store log in localStorage:', error);
    }
  }

  // Method to retrieve stored logs
  getLogs(): any[] {
    if (!this.storage) return [];
    
    const config = this.config as BrowserTransportConfig;
    const storageKey = config.storageKey || 'plip-logs';
    
    try {
      const logs = this.storage.getItem(storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('BrowserTransport: Failed to retrieve logs from localStorage:', error);
      return [];
    }
  }

  // Method to clear stored logs
  clearLogs(): void {
    if (!this.storage) return;
    
    const config = this.config as BrowserTransportConfig;
    const storageKey = config.storageKey || 'plip-logs';
    
    try {
      this.storage.removeItem(storageKey);
    } catch (error) {
      console.warn('BrowserTransport: Failed to clear logs from localStorage:', error);
    }
  }
}