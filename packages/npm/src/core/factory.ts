import type { LoggerFactory, Logger } from '../types/logger.js';
import type { PlipConfig, ResolvedPlipConfig } from '../types/config.js';
import { PlipLogger } from './logger.js';
import { ConsoleTransport } from '../transports/console.js';
import {
  defaultConfig,
  defaultTheme,
  createSSRConfig,
  createCSRConfig
} from './config.js';
import { supportsColor } from '../utils/env.js';

export class PlipLoggerFactory implements LoggerFactory {
  create(config: Partial<PlipConfig> = {}): Logger {
    const finalConfig: ResolvedPlipConfig = {
      ...defaultConfig,
      silent: config.silent ?? defaultConfig.silent,
      enableColors: config.enableColors ?? (defaultConfig.enableColors && supportsColor()),
      enableSyntaxHighlighting: config.enableSyntaxHighlighting ?? defaultConfig.enableSyntaxHighlighting,
      theme: config.theme ?? defaultConfig.theme,
      enabledLevels: config.enabledLevels ?? defaultConfig.enabledLevels,
      devOnly: config.devOnly ?? defaultConfig.devOnly,
      enableTimestamp: config.enableTimestamp ?? defaultConfig.enableTimestamp,
      enableStructuredOutput: config.enableStructuredOutput ?? defaultConfig.enableStructuredOutput,
      includeRequestId: config.includeRequestId ?? defaultConfig.includeRequestId,
      includeContext: config.includeContext ?? defaultConfig.includeContext,
      minLevel: config.minLevel ?? defaultConfig.minLevel,
      onError: config.onError ?? defaultConfig.onError,
    };

    const theme = {
      colors: { ...defaultTheme.colors, ...finalConfig.theme.colors },
      dimColors: { ...defaultTheme.dimColors, ...finalConfig.theme.dimColors },
    };

    // Default console transport. Deliberately not given `level`/`silent`: the
    // logger already gates those, and a snapshot here would desync from
    // levels()/silent() on derived loggers.
    const consoleTransport = new ConsoleTransport({ name: 'console' });

    return new PlipLogger(finalConfig, theme, {}, [consoleTransport]);
  }

  createSSRLogger(overrides: Partial<PlipConfig> = {}): Logger {
    const ssrConfig = createSSRConfig(overrides);
    return this.create(ssrConfig);
  }

  createCSRLogger(overrides: Partial<PlipConfig> = {}): Logger {
    const csrConfig = createCSRConfig(overrides);
    return this.create(csrConfig);
  }
}

export const loggerFactory = new PlipLoggerFactory();
