import { colors } from '../utils/colors.js';
import { isNode, isBrowser, isProduction } from '../utils/env.js';
import type { PlipTheme, PlipConfig, ResolvedPlipConfig } from '../types/config.js';

export type { LogLevel, ColorFn, PlipTheme, PlipConfig, ResolvedPlipConfig, LogErrorHandler, LogEntry, FormattedLogEntry } from '../types/config.js';

export const defaultTheme: PlipTheme = {
  colors: {
    info: colors.info,
    warn: colors.warn,
    error: colors.error,
    success: colors.success,
    debug: colors.debug,
    trace: colors.trace,
    verbose: colors.verbose,
  },
  dimColors: {
    info: colors.infoDim,
    warn: colors.warnDim,
    error: colors.errorDim,
    success: colors.successDim,
    debug: colors.debugDim,
    trace: colors.traceDim,
    verbose: colors.verboseDim,
  },
};

export const defaultConfig: ResolvedPlipConfig = {
  silent: false,
  enableColors: true,
  enableSyntaxHighlighting: true,
  theme: {},
  enabledLevels: ["info", "warn", "error", "success", "debug", "trace", "verbose"],
  devOnly: false,
  enableTimestamp: false,
  enableStructuredOutput: false,
  includeRequestId: false,
  includeContext: true,
};

/**
 * Server-side preset: timestamps and request ids for log aggregation.
 *
 * Production-dependent values are resolved when this module is first imported,
 * so `NODE_ENV` must be set before importing the package.
 * In production every level is off until the caller opts back in.
 */
export const ssrConfig: ResolvedPlipConfig = {
  silent: false,
  enableColors: !isProduction(),
  enableSyntaxHighlighting: true,
  theme: {},
  enabledLevels: isProduction()
    ? []
    : ["info", "warn", "error", "success", "debug", "trace", "verbose"],
  devOnly: false,
  enableTimestamp: true,
  enableStructuredOutput: isProduction(),
  includeRequestId: true,
  includeContext: true,
};

/**
 * Browser preset: the devtools console renders objects well, so no timestamps
 * or structured output. In production every level is off until the caller opts
 * back in.
 */
export const csrConfig: ResolvedPlipConfig = {
  silent: false,
  enableColors: true,
  enableSyntaxHighlighting: true,
  theme: {},
  enabledLevels: isProduction()
    ? []
    : ["verbose", "debug", "info", "success", "warn", "error", "trace"],
  devOnly: false,
  enableTimestamp: false,
  enableStructuredOutput: false,
  includeRequestId: false,
  includeContext: true,
};

/** Returns the SSR preset on a non-browser Node runtime, CSR otherwise. */
export function getAutoConfig(): ResolvedPlipConfig {
  if (isNode() && !isBrowser()) {
    return ssrConfig;
  }

  return csrConfig;
}

/** SSR preset with `overrides` applied. */
export function createSSRConfig(overrides: Partial<PlipConfig> = {}): ResolvedPlipConfig {
  return { ...ssrConfig, ...overrides };
}

/** CSR preset with `overrides` applied. */
export function createCSRConfig(overrides: Partial<PlipConfig> = {}): ResolvedPlipConfig {
  return { ...csrConfig, ...overrides };
}
