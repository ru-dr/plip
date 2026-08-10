import type { LogLevel } from '../types/config.js';

/**
 * Severity ranking used by `minLevel`. `success` sits alongside `info`: it is a
 * presentation variant of the same severity, not a step above it.
 */
export const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  trace: 10,
  verbose: 20,
  debug: 30,
  info: 40,
  success: 40,
  warn: 50,
  error: 60,
};

/** All levels ranked at or above `minLevel`, ordered from least to most severe. */
export function levelsAtOrAbove(minLevel: LogLevel): LogLevel[] {
  const threshold = LOG_LEVEL_SEVERITY[minLevel];

  return (Object.keys(LOG_LEVEL_SEVERITY) as LogLevel[])
    .filter(level => LOG_LEVEL_SEVERITY[level] >= threshold)
    .sort((a, b) => LOG_LEVEL_SEVERITY[a] - LOG_LEVEL_SEVERITY[b]);
}

/** Reports whether `level` is at or above `minLevel` in severity. */
export function meetsMinLevel(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[minLevel];
}
