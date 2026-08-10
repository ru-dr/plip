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
  LogEntry,
  ColorFn,
  LogErrorHandler,
  ResolvedPlipConfig
} from "./types/index.js";
export * from "./core/index.js";
export * from "./transports/index.js";
export * from "./formatters/index.js";
export * from "./adapters/index.js";

export { isDevelopment, isProduction, isNode, isBrowser, isDeno, getRuntimeEnvironment, supportsColor } from "./utils/env.js";
export { colors, colorize, stripColors, red, green, yellow, blue, magenta, cyan, gray, brightBlue, hasColors, highlightCode, formatObject } from "./utils/colors.js";
export { Timer, MemoryUsage, MetricsCollector, type PerformanceTimer, type Metrics } from "./utils/performance.js";

export { loggerFactory } from "./core/factory.js";
