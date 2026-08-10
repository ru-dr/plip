import type { Logger, LogTimer } from '../types/logger.js';
import type { LogLevel, PlipConfig, ResolvedPlipConfig, PlipTheme, FormattedLogEntry } from '../types/config.js';
import type { Transport } from '../types/transport.js';
import { TransportManager } from './transport.js';
import { meetsMinLevel } from './levels.js';
import { JsonFormatter } from '../formatters/json.js';
import { formatObject } from '../utils/colors.js';
import { isDevelopment } from '../utils/env.js';

function randomId(): string {
  const cryptoObj = (globalThis as any).crypto;
  if (typeof cryptoObj?.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

export class PlipLogger implements Logger {
  private static readonly jsonFormatter = new JsonFormatter({ pretty: false });

  private config: ResolvedPlipConfig;
  private theme: PlipTheme;
  private context: Record<string, any>;
  private transportManager: TransportManager;
  private requestId?: string;

  constructor(
    config: ResolvedPlipConfig,
    theme: PlipTheme,
    context: Record<string, any> = {},
    transports: Transport[] | TransportManager = []
  ) {
    this.config = config;
    this.theme = theme;
    this.context = context;

    // Derived loggers share the parent's manager so transport lifecycle stays
    // consistent across a logger family.
    if (transports instanceof TransportManager) {
      this.transportManager = transports;
    } else {
      this.transportManager = new TransportManager();
      transports.forEach(transport => this.transportManager.addTransport(transport));
    }
  }

  configure(newConfig: Partial<PlipConfig>): Logger {
    const updatedConfig = { ...this.config, ...newConfig };
    return new PlipLogger(updatedConfig, this.theme, this.context, this.transportManager);
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.silent) return false;
    if (this.config.devOnly && !isDevelopment()) return false;
    if (this.config.minLevel && !meetsMinLevel(level, this.config.minLevel)) return false;
    return this.config.enabledLevels.includes(level);
  }

  /**
   * A `requestId` in the context wins, so callers can correlate a real request
   * via `child({ requestId })`. Otherwise the id identifies this logger
   * instance and is generated once.
   */
  private resolveRequestId(): string {
    const fromContext = this.context['requestId'];
    if (typeof fromContext === 'string') return fromContext;

    this.requestId ??= randomId();
    return this.requestId;
  }

  private formatMessage(level: LogLevel, message: string, timestamp: Date): string {
    const prefix = this.config.enableTimestamp ? `${timestamp.toISOString()} ` : '';
    const levelText = `[${level.toUpperCase()}]`;

    if (!this.config.enableColors) {
      return `${prefix}${levelText} ${message}`;
    }

    const levelColor = this.theme.colors[level];
    const messageColor = this.theme.dimColors[level];

    const coloredLevel = levelColor ? levelColor(levelText) : levelText;
    const coloredMessage = messageColor ? messageColor(message) : message;

    return `${prefix}${coloredLevel} ${coloredMessage}`;
  }

  private processArgument(arg: any, colorize: boolean): string {
    if (typeof arg === "string") {
      return arg;
    }

    if (arg instanceof Error) {
      return arg.stack || `${arg.name}: ${arg.message}`;
    }

    if (colorize && this.config.enableSyntaxHighlighting && this.config.enableColors) {
      return formatObject(arg, true);
    }

    return JSON.stringify(arg, null, 2);
  }

  private async log(level: LogLevel, ...args: any[]): Promise<void> {
    if (!this.shouldLog(level)) return;

    // Context is folded into the trailing plain object when there is one, so
    // callers get a single merged payload rather than two objects.
    let processedArgs = args;
    if (Object.keys(this.context).length > 0 && this.config.includeContext) {
      const lastArgIndex = args.length - 1;
      const lastArg = args[lastArgIndex];

      if (lastArg && typeof lastArg === 'object' && lastArg.constructor === Object) {
        processedArgs = [
          ...args.slice(0, lastArgIndex),
          { ...this.context, ...lastArg }
        ];
      } else {
        processedArgs = [...args, this.context];
      }
    }

    // `message` stays free of ANSI codes so file and remote sinks get clean
    // text; only `formattedMessage` carries colors.
    const message = processedArgs.map(arg => this.processArgument(arg, false)).join(" ");
    const highlight = this.config.enableSyntaxHighlighting && this.config.enableColors;
    const highlighted = highlight
      ? processedArgs.map(arg => this.processArgument(arg, true)).join(" ")
      : message;
    const timestamp = new Date();
    const entry: FormattedLogEntry = {
      level,
      message,
      formattedMessage: this.formatMessage(level, highlighted, timestamp),
      timestamp,
      context: this.config.includeContext ? this.context : undefined,
      requestId: this.config.includeRequestId ? this.resolveRequestId() : undefined,
      args: processedArgs,
    };

    // Structured output replaces the human-readable rendering so log
    // aggregators receive one JSON object per line.
    if (this.config.enableStructuredOutput) {
      entry.formattedMessage = PlipLogger.jsonFormatter.format(entry);
    }

    await this.transportManager.log(entry, this.config.onError);
  }

  /** Resolves once every transport has drained its pending writes. */
  flush(): Promise<void> {
    return this.transportManager.flush();
  }

  info = (...args: any[]) => this.log("info", ...args);
  warn = (...args: any[]) => this.log("warn", ...args);
  error = (...args: any[]) => this.log("error", ...args);
  success = (...args: any[]) => this.log("success", ...args);
  debug = (...args: any[]) => this.log("debug", ...args);
  trace = (...args: any[]) => this.log("trace", ...args);
  verbose = (...args: any[]) => this.log("verbose", ...args);

  silent(): Logger {
    return this.configure({ silent: true });
  }

  withColors(enabled: boolean = true): Logger {
    return this.configure({ enableColors: enabled });
  }

  withSyntaxHighlighting(enabled: boolean = true): Logger {
    return this.configure({ enableSyntaxHighlighting: enabled });
  }

  withContext(context: Record<string, any>): Logger {
    return new PlipLogger(
      this.config,
      this.theme,
      { ...this.context, ...context },
      this.transportManager
    );
  }

  levels(...levels: LogLevel[]): Logger {
    return this.configure({ enabledLevels: levels });
  }

  minLevel(level: LogLevel): Logger {
    return this.configure({ minLevel: level });
  }

  addTransport(transport: Transport): Logger {
    this.transportManager.addTransport(transport);
    return this;
  }

  removeTransport(name: string): Logger {
    this.transportManager.removeTransport(name);
    return this;
  }

  clearTransports(): Logger {
    this.transportManager.clearTransports();
    return this;
  }

  getTransports(): Transport[] {
    return this.transportManager.getTransports();
  }

  startTimer(label?: string): LogTimer {
    const timerLabel = label || `Timer-${Date.now()}`;
    const startTime = performance.now();

    return {
      label: timerLabel,
      startTime,
      end: (message?: string) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const logMessage = message
          ? `${message} (${duration.toFixed(2)}ms)`
          : `Timer "${timerLabel}" completed in ${duration.toFixed(2)}ms`;

        this.info(logMessage);
      }
    };
  }

  child(context: Record<string, any>): Logger {
    return this.withContext(context);
  }
}
