// src/transports/console.ts

import type { ConsoleTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry, PlipTheme } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';
import { formatObject } from '../utils/colors.js';

export class ConsoleTransport extends BaseTransport {
  private theme?: PlipTheme;

  constructor(config: ConsoleTransportConfig, theme?: PlipTheme) {
    super(config);
    this.theme = theme;
  }

  log(entry: FormattedLogEntry): void {
    const config = this.config as ConsoleTransportConfig;
    
    // If this transport was configured with custom settings, use those
    // Otherwise use the formatted message from the entry
    if (config.useColors !== undefined || config.useEmojis !== undefined || config.useSyntaxHighlighting !== undefined) {
      console.log(this.formatMessage(entry));
    } else {
      // Use the pre-formatted message from the logger
      console.log(entry.formattedMessage);
    }
  }

  private formatMessage(entry: FormattedLogEntry): string {
    const config = this.config as ConsoleTransportConfig;
    const emoji = (config.useEmojis && this.theme) ? this.theme.emojis[entry.level] : "";
    const levelText = `[${entry.level.toUpperCase()}]`;
    
    if (!config.useColors || !this.theme) {
      return `${emoji} ${levelText} ${entry.message}`;
    }

    // Use regular color for level text and emoji, dim color for the message
    const levelColor = this.theme.colors[entry.level];
    const messageColor = this.theme.dimColors[entry.level];
    
    const coloredLevel = levelColor ? levelColor(`${emoji} ${levelText}`) : `${emoji} ${levelText}`;
    const coloredMessage = messageColor ? messageColor(entry.message) : entry.message;
    
    return `${coloredLevel} ${coloredMessage}`;
  }
}