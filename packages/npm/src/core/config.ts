// src/lib/config.ts

import { colors } from '../utils/colors.js';
import { isNode, isBrowser, isProduction } from '../utils/env.js';
import type { LogLevel, PlipTheme, PlipConfig } from '../types/config.js';

// Re-export types for backward compatibility
export type { LogLevel, PlipTheme, PlipConfig, LogEntry, FormattedLogEntry } from '../types/config.js';

export const defaultTheme: PlipTheme = {
  emojis: {
    info: "🫧",
    warn: "⚠️",
    error: "💥",
    success: "🎉",
    debug: "🔍",
    trace: "🛰️",
    verbose: "📢",
  },
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

export const defaultConfig: Required<PlipConfig> = {
  silent: false,
  enableEmojis: true,
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

// SSR (Server-Side Rendering) Configuration
// Optimized for server environments with clean, structured logs
export const ssrConfig: Required<PlipConfig> = {
  silent: false,
  enableEmojis: false, // Disabled for clean server logs that go to files/aggregation systems
  enableColors: !isProduction(), // Colors only in development, disabled in production for structured logs
  enableSyntaxHighlighting: true, // Keep for object formatting - useful for debugging
  theme: {},
  enabledLevels: isProduction() 
    ? [] // No logs in production by default - user must explicitly enable
    : ["info", "warn", "error", "success", "debug", "trace", "verbose"], // All levels in development
  devOnly: false,
  enableTimestamp: true, // Essential for server logs
  enableStructuredOutput: isProduction(), // JSON output for log aggregation in production
  includeRequestId: true, // For request correlation
  includeContext: true, // Include context by default
};

// CSR (Client-Side Rendering) Configuration 
// Optimized for browser environments with all visual features enabled
export const csrConfig: Required<PlipConfig> = {
  silent: false,
  enableEmojis: true, // Visual appeal in browser console
  enableColors: true, // Enhanced readability in browser dev tools
  enableSyntaxHighlighting: true, // Rich formatting for debugging
  theme: {},
  enabledLevels: isProduction() 
    ? [] // No logs in production by default - user must explicitly enable
    : ["verbose", "debug", "info", "success", "warn", "error", "trace"], // Full logging in development
  devOnly: false,
  enableTimestamp: false, // Less clutter in browser console
  enableStructuredOutput: false, // Browser console handles objects well
  includeRequestId: false, // Not typically needed in CSR
  includeContext: true, // Include context for debugging
};

/**
 * Automatically detects the environment and returns appropriate configuration
 * CSR is the default as requested
 */
export function getAutoConfig(): Required<PlipConfig> {
  // If explicitly in Node.js server environment, use SSR config
  if (isNode() && !isBrowser()) {
    return ssrConfig;
  }
  
  // For browser or mixed environments, default to CSR
  return csrConfig;
}

/**
 * Creates a configuration optimized for SSR (Server-Side Rendering)
 * @param overrides Optional configuration overrides
 */
export function createSSRConfig(overrides: Partial<PlipConfig> = {}): Required<PlipConfig> {
  return { ...ssrConfig, ...overrides };
}

/**
 * Creates a configuration optimized for CSR (Client-Side Rendering)
 * @param overrides Optional configuration overrides
 */
export function createCSRConfig(overrides: Partial<PlipConfig> = {}): Required<PlipConfig> {
  return { ...csrConfig, ...overrides };
}
