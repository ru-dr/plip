// src/core/logger.ts

import type { Logger, LogTimer } from '../types/logger.js';
import type { LogLevel, PlipConfig, PlipTheme, FormattedLogEntry } from '../types/config.js';
import type { Transport } from '../types/transport.js';
import { TransportManager } from './transport.js';
import { formatObject } from '../utils/colors.js';
import { isDevelopment } from '../utils/env.js';

export class PlipLogger implements Logger {
  private config: Required<PlipConfig>;
  private theme: PlipTheme;
  private context: Record<string, any>;
  private transportManager: TransportManager;
  private requestId?: string;

  constructor(
    config: Required<PlipConfig>, 
    theme: PlipTheme, 
    context: Record<string, any> = {},
    transports: Transport[] = []
  ) {
    this.config = config;
    this.theme = theme;
    this.context = context;
    this.transportManager = new TransportManager();
    
    // Add provided transports
    transports.forEach(transport => this.transportManager.addTransport(transport));
  }

  configure(newConfig: Partial<PlipConfig>): Logger {
    const updatedConfig = { ...this.config, ...newConfig };
    return new PlipLogger(updatedConfig, this.theme, this.context, this.transportManager.getTransports());
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.silent) return false;
    if (this.config.devOnly && !isDevelopment()) return false;
    return this.config.enabledLevels.includes(level);
  }

  private generateRequestId(): string {
    if (this.requestId) return this.requestId;
    
    // Generate a simple request ID
    this.requestId = Math.random().toString(36).substring(2, 15);
    return this.requestId;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const emoji = this.config.enableEmojis ? this.theme.emojis[level] : "";
    const levelText = `[${level.toUpperCase()}]`;
    
    if (!this.config.enableColors) {
      return `${emoji} ${levelText} ${message}`;
    }

    // Use regular color for level text and emoji, dim color for the message
    const levelColor = this.theme.colors[level];
    const messageColor = this.theme.dimColors[level];
    
    const coloredLevel = levelColor ? levelColor(`${emoji} ${levelText}`) : `${emoji} ${levelText}`;
    const coloredMessage = messageColor ? messageColor(message) : message;
    
    return `${coloredLevel} ${coloredMessage}`;
  }

  private processArgument(arg: any): string {
    if (typeof arg === "string") {
      return arg;
    }
    
    if (this.config.enableSyntaxHighlighting && this.config.enableColors) {
      return formatObject(arg, true);
    }
    
    return JSON.stringify(arg, null, 2);
  }

  private async log(level: LogLevel, ...args: any[]): Promise<void> {
    if (!this.shouldLog(level)) return;

    // Handle context merging when there are object arguments and context exists
    let processedArgs = args;
    if (Object.keys(this.context).length > 0 && this.config.includeContext) {
      // Find the last object argument to merge context with
      const lastArgIndex = args.length - 1;
      const lastArg = args[lastArgIndex];
      
      if (lastArg && typeof lastArg === 'object' && lastArg.constructor === Object) {
        // Merge context with the last object argument
        processedArgs = [
          ...args.slice(0, lastArgIndex),
          { ...this.context, ...lastArg }
        ];
      } else {
        // No object to merge with, append context as a new argument
        processedArgs = [...args, this.context];
      }
    }

    const formattedArgs = processedArgs.map(arg => this.processArgument(arg));
    const message = formattedArgs.join(" ");
    const formattedMessage = this.formatMessage(level, message);

    // Create log entry
    const entry: FormattedLogEntry = {
      level,
      message,
      formattedMessage,
      timestamp: new Date(),
      context: this.config.includeContext ? this.context : undefined,
      requestId: this.config.includeRequestId ? this.generateRequestId() : undefined,
      args: processedArgs, // Add the required args property
    };

    // Send to all transports
    await this.transportManager.log(entry);
  }

  // Log level methods
  info = (...args: any[]) => this.log("info", ...args);
  warn = (...args: any[]) => this.log("warn", ...args);
  error = (...args: any[]) => this.log("error", ...args);
  success = (...args: any[]) => this.log("success", ...args);
  debug = (...args: any[]) => this.log("debug", ...args);
  trace = (...args: any[]) => this.log("trace", ...args);
  verbose = (...args: any[]) => this.log("verbose", ...args);

  // Configuration methods
  silent(): Logger {
    return this.configure({ silent: true });
  }

  withEmojis(enabled: boolean = true): Logger {
    return this.configure({ enableEmojis: enabled });
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
      this.transportManager.getTransports()
    );
  }

  levels(...levels: LogLevel[]): Logger {
    return this.configure({ enabledLevels: levels });
  }

  // Transport methods
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

  // Utility methods
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