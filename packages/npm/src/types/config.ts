export type LogLevel = "info" | "warn" | "error" | "success" | "debug" | "trace" | "verbose";

export type ColorFn = (text: string) => string;

/** Called when a transport throws or rejects. */
export type LogErrorHandler = (error: unknown, transportName: string) => void;

export interface PlipTheme {
  colors: Record<LogLevel, ColorFn>;
  dimColors: Record<LogLevel, ColorFn>; // Reduced-emphasis variants
}

export interface PlipConfig {
  silent?: boolean;
  enableColors?: boolean;
  enableSyntaxHighlighting?: boolean;
  theme?: Partial<PlipTheme>;
  /** Explicit allowlist of levels. Combined with `minLevel` when both are set. */
  enabledLevels?: LogLevel[];
  /** Severity threshold: levels ranked below this one are dropped. */
  minLevel?: LogLevel;
  devOnly?: boolean;
  enableTimestamp?: boolean;
  enableStructuredOutput?: boolean;
  includeRequestId?: boolean;
  includeContext?: boolean;
  onError?: LogErrorHandler;
}

/**
 * A config with every presentation option resolved. `minLevel` and `onError`
 * stay optional because "unset" is meaningful for both.
 */
export type ResolvedPlipConfig =
  Required<Omit<PlipConfig, 'minLevel' | 'onError'>> & Pick<PlipConfig, 'minLevel' | 'onError'>;

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
