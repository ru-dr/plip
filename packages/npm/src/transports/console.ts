import type { ConsoleTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';
import { stripColors } from '../utils/colors.js';

export class ConsoleTransport extends BaseTransport {
  constructor(config: ConsoleTransportConfig) {
    super(config);
  }

  log(entry: FormattedLogEntry): void {
    const config = this.config as ConsoleTransportConfig;

    // The logger owns formatting (level prefix, colors, object highlighting).
    // This transport only decides whether to keep the ANSI codes, so that
    // logger-level toggles like withColors() actually reach the output.
    if (config.useColors === false) {
      console.log(stripColors(entry.formattedMessage));
      return;
    }

    console.log(entry.formattedMessage);
  }
}
