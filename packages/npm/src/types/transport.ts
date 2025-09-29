// src/types/transport.ts

import type { LogEntry, FormattedLogEntry, LogLevel } from './config.js';

export interface Transport {
  name: string;
  log(entry: FormattedLogEntry): void | Promise<void>;
  shouldLog?(level: LogLevel): boolean;
  configure?(config: any): void;
  close?(): void | Promise<void>;
}

export interface TransportConfig {
  name: string;
  level?: LogLevel[];
  silent?: boolean;
}

export interface FileTransportConfig extends TransportConfig {
  filename: string;
  maxSize?: number; // Maximum file size in bytes
  maxFiles?: number; // Maximum number of files to keep
  format?: 'json' | 'text';
  datePattern?: string; // For log rotation
}

export interface RemoteTransportConfig extends TransportConfig {
  url: string;
  apiKey?: string;
  batchSize?: number;
  flushInterval?: number; // in milliseconds
  headers?: Record<string, string>;
  timeout?: number;
}

export interface BrowserTransportConfig extends TransportConfig {
  useLocalStorage?: boolean;
  storageKey?: string;
  maxStorageSize?: number; // Maximum size in localStorage
  enableConsoleGroup?: boolean;
}

export interface ConsoleTransportConfig extends TransportConfig {
  useColors?: boolean;
  useEmojis?: boolean;
  useSyntaxHighlighting?: boolean;
}