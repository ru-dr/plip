// src/index.ts

// Re-export everything from core (includes legacy compatibility)
export * from "./core/index.js";

// New enhanced architecture exports - only export new types
export type { 
  Transport, 
  TransportConfig, 
  FileTransportConfig, 
  RemoteTransportConfig, 
  BrowserTransportConfig, 
  ConsoleTransportConfig,
  Logger,
  LogTimer,
  LoggerFactory,
  FormattedLogEntry,
  LogEntry
} from "./types/index.js";
export * from "./core/index.js";
export * from "./transports/index.js";
export * from "./formatters/index.js";
export * from "./adapters/index.js";

// Utility exports
export { isDevelopment, isProduction, isNode, isBrowser, isDeno, getRuntimeEnvironment, supportsColor, supportsEmoji } from "./utils/env.js";
export { colors, colorize, stripColors, red, green, yellow, blue, magenta, cyan, gray, brightBlue, hasColors, highlightCode, formatObject } from "./utils/colors.js";
export { Timer, MemoryUsage, MetricsCollector, type PerformanceTimer, type Metrics } from "./utils/performance.js";

// Convenience exports for easy adoption
export { loggerFactory } from "./core/factory.js";