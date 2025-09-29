// src/types/logger.ts

import type { LogLevel, LogEntry, PlipConfig } from './config.js';
import type { Transport } from './transport.js';

export interface Logger {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  success(...args: any[]): void;
  debug(...args: any[]): void;
  trace(...args: any[]): void;
  verbose(...args: any[]): void;
  
  // Configuration methods
  configure(config: Partial<PlipConfig>): Logger;
  silent(): Logger;
  withEmojis(enabled?: boolean): Logger;
  withColors(enabled?: boolean): Logger;
  withSyntaxHighlighting(enabled?: boolean): Logger;
  withContext(context: Record<string, any>): Logger;
  levels(...levels: LogLevel[]): Logger;
  
  // Transport methods
  addTransport(transport: Transport): Logger;
  removeTransport(name: string): Logger;
  clearTransports(): Logger;
  getTransports(): Transport[];
  
  // Utility methods
  startTimer(label?: string): LogTimer;
  child(context: Record<string, any>): Logger;
}

export interface LogTimer {
  end(message?: string): void;
  label: string;
  startTime: number;
}

export interface LoggerFactory {
  create(config?: Partial<PlipConfig>): Logger;
  createSSRLogger(overrides?: Partial<PlipConfig>): Logger;
  createCSRLogger(overrides?: Partial<PlipConfig>): Logger;
}