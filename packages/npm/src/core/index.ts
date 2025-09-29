// src/core/index.ts

// Import loggerFactory for creating legacy instances
import { loggerFactory } from './factory.js';
import type { PlipConfig } from './config.js';

// Core exports
export { PlipLogger } from './logger.js';
export { BaseTransport, TransportManager } from './transport.js';
export { PlipLoggerFactory, loggerFactory } from './factory.js';

// Configuration exports
export { 
  defaultTheme, 
  defaultConfig, 
  ssrConfig, 
  csrConfig, 
  getAutoConfig, 
  createSSRConfig, 
  createCSRConfig 
} from './config.js';

// Type exports
export type { LogLevel, PlipConfig, PlipTheme, LogEntry, FormattedLogEntry } from './config.js';

// Legacy-compatible logger instances for backward compatibility
export const plip = loggerFactory.createCSRLogger(); // Default CSR logger
export const createPlip = (config: Partial<PlipConfig> = {}) => loggerFactory.create(config);
export const createSSRLogger = (overrides: Partial<PlipConfig> = {}) => loggerFactory.createSSRLogger(overrides);
export const createCSRLogger = (overrides: Partial<PlipConfig> = {}) => loggerFactory.createCSRLogger(overrides);
export const ssrLogger = loggerFactory.createSSRLogger();
export const csrLogger = loggerFactory.createCSRLogger();