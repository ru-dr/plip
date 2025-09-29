// src/core/factory.ts

import type { LoggerFactory, Logger } from '../types/logger.js';
import type { PlipConfig } from '../types/config.js';
import { PlipLogger } from './logger.js';
import { ConsoleTransport } from '../transports/console.js';
import { 
  defaultConfig, 
  defaultTheme,
  createSSRConfig, 
  createCSRConfig 
} from './config.js';
import { supportsColor, supportsEmoji, isDevelopment } from '../utils/env.js';

export class PlipLoggerFactory implements LoggerFactory {
  create(config: Partial<PlipConfig> = {}): Logger {
    const isDev = isDevelopment();
    
    const finalConfig: Required<PlipConfig> = {
      ...defaultConfig,
      silent: config.silent ?? defaultConfig.silent,
      enableEmojis: config.enableEmojis ?? (defaultConfig.enableEmojis && supportsEmoji()),
      enableColors: config.enableColors ?? (defaultConfig.enableColors && supportsColor()),
      enableSyntaxHighlighting: config.enableSyntaxHighlighting ?? defaultConfig.enableSyntaxHighlighting,
      theme: config.theme ?? defaultConfig.theme,
      enabledLevels: config.enabledLevels ?? defaultConfig.enabledLevels,
      devOnly: config.devOnly ?? isDev,
      enableTimestamp: config.enableTimestamp ?? defaultConfig.enableTimestamp,
      enableStructuredOutput: config.enableStructuredOutput ?? defaultConfig.enableStructuredOutput,
      includeRequestId: config.includeRequestId ?? defaultConfig.includeRequestId,
      includeContext: config.includeContext ?? defaultConfig.includeContext,
    };

    const theme = {
      emojis: { ...defaultTheme.emojis, ...finalConfig.theme.emojis },
      colors: { ...defaultTheme.colors, ...finalConfig.theme.colors },
      dimColors: { ...defaultTheme.dimColors, ...finalConfig.theme.dimColors },
    };

    // Create default console transport
    const consoleTransport = new ConsoleTransport(
      {
        name: 'console',
        level: finalConfig.enabledLevels,
        silent: finalConfig.silent,
        useColors: finalConfig.enableColors,
        useEmojis: finalConfig.enableEmojis,
        useSyntaxHighlighting: finalConfig.enableSyntaxHighlighting,
      },
      theme
    );

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

// Export singleton factory instance
export const loggerFactory = new PlipLoggerFactory();