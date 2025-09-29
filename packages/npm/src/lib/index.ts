// src/lib/index.ts
// Legacy compatibility layer - re-exports from core

// Re-export logger instances and factories from the enhanced core implementation
export { loggerFactory } from "../core/factory.js";

// Create legacy-compatible instances using the new factory
import { loggerFactory } from "../core/factory.js";

export const plip = loggerFactory.createCSRLogger(); // Default CSR logger
export const createPlip = (config: any = {}) => loggerFactory.create(config);
export const createSSRLogger = (overrides: any = {}) => loggerFactory.createSSRLogger(overrides);
export const createCSRLogger = (overrides: any = {}) => loggerFactory.createCSRLogger(overrides);
export const ssrLogger = loggerFactory.createSSRLogger();
export const csrLogger = loggerFactory.createCSRLogger();

// Re-export types and configs from core
export type { LogLevel, PlipConfig, PlipTheme, LogEntry, FormattedLogEntry } from "../core/config.js";

export { 
  defaultTheme, 
  defaultConfig, 
  ssrConfig, 
  csrConfig, 
  getAutoConfig, 
  createSSRConfig, 
  createCSRConfig 
} from "../core/config.js";
