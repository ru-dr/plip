import type { FormattedLogEntry } from '../types/config.js';

export interface JsonFormatterOptions {
  includeTimestamp?: boolean;
  includeLevel?: boolean;
  includeMessage?: boolean;
  includeContext?: boolean;
  includeRequestId?: boolean;
  pretty?: boolean;
}

export class JsonFormatter {
  private options: Required<JsonFormatterOptions>;

  constructor(options: JsonFormatterOptions = {}) {
    this.options = {
      includeTimestamp: options.includeTimestamp ?? true,
      includeLevel: options.includeLevel ?? true,
      includeMessage: options.includeMessage ?? true,
      includeContext: options.includeContext ?? true,
      includeRequestId: options.includeRequestId ?? true,
      pretty: options.pretty ?? false,
    };
  }

  format(entry: FormattedLogEntry): string {
    const output: Record<string, any> = {};

    if (this.options.includeTimestamp) {
      output.timestamp = entry.timestamp.toISOString();
    }

    if (this.options.includeLevel) {
      output.level = entry.level;
    }

    if (this.options.includeMessage) {
      output.message = entry.message;
    }

    if (this.options.includeContext && entry.context) {
      output.context = entry.context;
    }

    if (this.options.includeRequestId && entry.requestId) {
      output.requestId = entry.requestId;
    }

    return JSON.stringify(output, null, this.options.pretty ? 2 : undefined);
  }
}
