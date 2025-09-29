// src/types/config.ts

export type LogLevel = "info" | "warn" | "error" | "success" | "debug" | "trace" | "verbose";

export interface PlipTheme {
  emojis: Record<LogLevel, string>;
  colors: Record<LogLevel, any>; // Changed to any to support chalk functions
  dimColors: Record<LogLevel, any>; // Added dim colors for reduced opacity
}

export interface PlipConfig {
  silent?: boolean;
  enableEmojis?: boolean;
  enableColors?: boolean;
  enableSyntaxHighlighting?: boolean;
  theme?: Partial<PlipTheme>;
  enabledLevels?: LogLevel[];
  devOnly?: boolean;
  // Enhanced configuration for better SSR/CSR support
  enableTimestamp?: boolean; // For server logs with timing information
  enableStructuredOutput?: boolean; // For JSON-formatted output suitable for log aggregation
  includeRequestId?: boolean; // For request correlation in SSR
  includeContext?: boolean; // Whether to include context by default
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  requestId?: string;
  args: any[];
}

export interface FormattedLogEntry extends LogEntry {
  formattedMessage: string;
}