import type { FormattedLogEntry } from '../types/config.js';

export interface TextFormatterOptions {
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeRequestId?: boolean;
  timestampFormat?: 'iso' | 'local' | 'time';
  levelPadding?: number;
}

export class TextFormatter {
  private options: Required<TextFormatterOptions>;

  constructor(options: TextFormatterOptions = {}) {
    this.options = {
      includeTimestamp: options.includeTimestamp ?? true,
      includeLevel: options.includeLevel ?? true,
      includeRequestId: options.includeRequestId ?? true,
      timestampFormat: options.timestampFormat ?? 'iso',
      levelPadding: options.levelPadding ?? 7,
    };
  }

  format(entry: FormattedLogEntry): string {
    const parts: string[] = [];

    if (this.options.includeTimestamp) {
      parts.push(this.formatTimestamp(entry.timestamp));
    }

    if (this.options.includeLevel) {
      parts.push(this.formatLevel(entry.level));
    }

    if (this.options.includeRequestId && entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }

    // Use the raw message: formattedMessage carries ANSI color codes, which
    // must not end up in log files or other plain-text sinks.
    parts.push(entry.message);

    return parts.join(' ');
  }

  private formatTimestamp(timestamp: Date): string {
    switch (this.options.timestampFormat) {
      case 'iso':
        return timestamp.toISOString();
      case 'local':
        return timestamp.toLocaleString();
      case 'time':
        return timestamp.toLocaleTimeString();
      default:
        return timestamp.toISOString();
    }
  }

  private formatLevel(level: string): string {
    return `[${level.toUpperCase().padEnd(this.options.levelPadding)}]`;
  }
}
