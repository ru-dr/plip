import { loggerFactory } from './factory.js';
import type { PlipConfig } from './config.js';

export { PlipLogger } from './logger.js';
export { LOG_LEVEL_SEVERITY, levelsAtOrAbove, meetsMinLevel } from './levels.js';
export { BaseTransport, TransportManager } from './transport.js';
export { PlipLoggerFactory, loggerFactory } from './factory.js';

export {
  defaultTheme,
  defaultConfig,
  ssrConfig,
  csrConfig,
  getAutoConfig,
  createSSRConfig,
  createCSRConfig
} from './config.js';

export type { LogLevel, ColorFn, PlipConfig, ResolvedPlipConfig, LogErrorHandler, PlipTheme, LogEntry, FormattedLogEntry } from './config.js';

// Legacy-compatible logger instances for backward compatibility
export const plip = loggerFactory.createCSRLogger(); // Default CSR logger
export const createPlip = (config: Partial<PlipConfig> = {}) => loggerFactory.create(config);
export const createSSRLogger = (overrides: Partial<PlipConfig> = {}) => loggerFactory.createSSRLogger(overrides);
export const createCSRLogger = (overrides: Partial<PlipConfig> = {}) => loggerFactory.createCSRLogger(overrides);
export const ssrLogger = loggerFactory.createSSRLogger();
export const csrLogger = loggerFactory.createCSRLogger();
