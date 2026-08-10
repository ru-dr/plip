# Types API

Complete TypeScript type definitions for Plip Logger.

## Core Types

### `Logger`

The main logger interface providing all logging methods. `PlipLogger` is the class that implements it.

```typescript
interface Logger {
  // Log level methods
  verbose(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  success(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  trace(...args: any[]): void;

  // Configuration methods (each returns a new logger)
  configure(config: Partial<PlipConfig>): Logger;
  silent(): Logger;
  withColors(enabled?: boolean): Logger;
  withSyntaxHighlighting(enabled?: boolean): Logger;
  withContext(context: Record<string, any>): Logger;
  levels(...levels: LogLevel[]): Logger;
  minLevel(level: LogLevel): Logger;

  // Transports
  addTransport(transport: Transport): Logger;
  removeTransport(name: string): Logger;
  clearTransports(): Logger;
  getTransports(): Transport[];
  flush(): Promise<void>;

  // Utilities
  startTimer(label?: string): LogTimer;
  child(context: Record<string, any>): Logger;
}
```

#### Method Signatures

All logging methods follow the same signature pattern:

```typescript
type LogMethod = (...args: any[]) => void;
```

**Parameters**:
- `args`: Any number of values. Strings are printed as-is, `Error` instances print their stack, and other values are JSON-serialized.

**Returns**: `void` — logging methods do not chain.

### `PlipConfig`

Configuration interface for customizing logger behavior.

```typescript
interface PlipConfig {
  silent?: boolean;
  enableColors?: boolean;
  enableSyntaxHighlighting?: boolean;
  theme?: Partial<PlipTheme>;
  enabledLevels?: LogLevel[];
  minLevel?: LogLevel;
  devOnly?: boolean;
  enableTimestamp?: boolean;
  enableStructuredOutput?: boolean;
  includeRequestId?: boolean;
  includeContext?: boolean;
  onError?: LogErrorHandler;
}
```

See [Configuration API](/api/configuration) for detailed property descriptions.

### `ResolvedPlipConfig`

A `PlipConfig` with every presentation option resolved. `minLevel` and `onError` stay optional, because "unset" is meaningful for both.

```typescript
type ResolvedPlipConfig =
  Required<Omit<PlipConfig, 'minLevel' | 'onError'>> & Pick<PlipConfig, 'minLevel' | 'onError'>;
```

This is the type of `defaultConfig`, `ssrConfig` and `csrConfig`, and what the `PlipLogger` constructor expects.

### `LogLevel`

Union type of all available log levels.

```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug' | 'trace' | 'verbose';
```

### `LogErrorHandler`

Called when a transport throws or rejects. Used by `PlipConfig.onError` and `TransportConfig.onError`.

```typescript
type LogErrorHandler = (error: unknown, transportName: string) => void;
```

### `ColorFn`

A single-argument string transform, used throughout the theme.

```typescript
type ColorFn = (text: string) => string;
```

### `PlipTheme`

```typescript
interface PlipTheme {
  colors: Record<LogLevel, ColorFn>;
  dimColors: Record<LogLevel, ColorFn>;
}
```

### `LogTimer`

Returned by `startTimer()`.

```typescript
interface LogTimer {
  label: string;
  startTime: number;
  end(message?: string): void;
}
```

### `LogEntry` / `FormattedLogEntry`

```typescript
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  requestId?: string;
  args: any[];
}

interface FormattedLogEntry extends LogEntry {
  formattedMessage: string;
}
```

## Level Severity Helpers

Plip exports the severity ranking behind `minLevel`, plus two helpers built on it.

```typescript
import { LOG_LEVEL_SEVERITY, levelsAtOrAbove, meetsMinLevel } from '@ru-dr/plip';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number>;
function levelsAtOrAbove(minLevel: LogLevel): LogLevel[];
function meetsMinLevel(level: LogLevel, minLevel: LogLevel): boolean;
```

`LOG_LEVEL_SEVERITY` ranks `trace` 10, `verbose` 20, `debug` 30, `info` 40, `success` 40, `warn` 50, `error` 60. `success` shares a rank with `info` deliberately.

```typescript
LOG_LEVEL_SEVERITY.error;      // 60
levelsAtOrAbove('info');       // ['info', 'success', 'warn', 'error']
meetsMinLevel('debug', 'warn'); // false
```

`levelsAtOrAbove` returns the levels ordered from least to most severe, which makes it a convenient way to build an `enabledLevels` allowlist.

## Factory Function Types

### `createPlip`

Factory function type for creating logger instances.

```typescript
type CreatePlipFunction = (config?: Partial<PlipConfig>) => Logger;
```

**Usage**:
```typescript
import { createPlip } from '@ru-dr/plip';

const logger: Logger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

## Utility Types

### Log data

Log methods accept any values as extra arguments. These types are not exported by Plip; they are shown here only to illustrate what can be passed.

```typescript
type LogData = any;
```

While typed as `any` for flexibility, the data should be serializable to JSON.

**Examples**:
```typescript
// Primitive values
const stringData: LogData = "hello";
const numberData: LogData = 42;
const booleanData: LogData = true;

// Objects
const objectData: LogData = {
  user: { id: 123, name: "Alice" },
  timestamp: new Date().toISOString(),
  metadata: { version: "1.0.0" }
};

// Arrays
const arrayData: LogData = ["item1", "item2", "item3"];
```

### `Partial<PlipConfig>`

Configuration updates use TypeScript's built-in `Partial`:

```typescript
type PartialPlipConfig = Partial<PlipConfig>;
```

Used in the `configure` method, which returns a new logger:
```typescript
const quietLogger = logger.configure({
  enableColors: false // Only update this property
});
```

## Level-Specific Types

These narrow aliases are not exported by Plip; define them yourself if you need them.

### `VerboseLevel`

```typescript
type VerboseLevel = 'verbose';
```

### `DebugLevel`

```typescript
type DebugLevel = 'debug';
```

### `InfoLevel`

```typescript
type InfoLevel = 'info';
```

### `SuccessLevel`

```typescript
type SuccessLevel = 'success';
```

### `WarnLevel`

```typescript
type WarnLevel = 'warn';
```

### `ErrorLevel`

```typescript
type ErrorLevel = 'error';
```

### `TraceLevel`

```typescript
type TraceLevel = 'trace';
```

## Type Guards

Plip does not ship type guards; the following are examples you can copy into your own code.

### `isLogLevel`

Type guard to check if a string is a valid log level.

```typescript
function isLogLevel(value: string): value is LogLevel {
  return ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace'].includes(value);
}
```

**Usage**:
```typescript
const userInput = "info";
if (isLogLevel(userInput)) {
  logger[userInput]("This is type-safe!");
}
```

### `isPlipLogger`

Type guard to check if an object is a Plip logger instance.

```typescript
function isPlipLogger(obj: any): obj is Logger {
  return obj &&
         typeof obj.info === 'function' &&
         typeof obj.error === 'function' &&
         typeof obj.configure === 'function';
}
```

## Generic Types

### `LoggerMethod<T>`

Generic type for logger methods with custom return types.

```typescript
type LoggerMethod<T = void> = (...args: any[]) => T;
```

### `ConfigurableLogger<T>`

Generic interface for configurable loggers.

```typescript
interface ConfigurableLogger<T extends PlipConfig = PlipConfig> {
  configure(config: Partial<T>): Logger;
}
```

## Advanced Type Usage

### Strongly Typed Logger Factory

```typescript
interface StrictPlipConfig {
  enableColors: boolean;
  enabledLevels: LogLevel[];
}

function createStrictPlip(config: StrictPlipConfig): Logger {
  return createPlip(config);
}

// Usage requires all properties
const logger = createStrictPlip({
  enableColors: true,      // Required
  enabledLevels: ['info']  // Required
});
```

### Level-Constrained Logger

```typescript
type LimitedLogLevel = 'info' | 'warn' | 'error';

interface LimitedPlipConfig extends Omit<PlipConfig, 'enabledLevels'> {
  enabledLevels?: LimitedLogLevel[];
}

function createLimitedLogger(config?: LimitedPlipConfig): Logger {
  return createPlip(config);
}
```

### Method-Specific Types

```typescript
type InfoMethod = Logger['info'];
type ErrorMethod = Logger['error'];
type ConfigureMethod = Logger['configure'];

// Extract method signature
type LogMethodSignature = (...args: any[]) => void;
```

## Type Examples

### Service Logger with Constraints

```typescript
interface ServiceLoggerConfig {
  serviceName: string;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class ServiceLogger {
  private logger: Logger;
  
  constructor(private config: ServiceLoggerConfig) {
    this.logger = createPlip({
      enableColors: config.environment !== 'test',
      minLevel: config.logLevel
    });
  }
  
  info(message: string, data?: any): void {
    this.logger.info(`[${this.config.serviceName}] ${message}`, data);
  }
  
  error(message: string, data?: any): void {
    this.logger.error(`[${this.config.serviceName}] ${message}`, data);
  }
}
```

### Typed Log Data

```typescript
interface UserLogData {
  userId: number;
  email: string;
  action: string;
  timestamp: string;
}

interface ErrorLogData {
  error: string;
  stack?: string;
  context?: Record<string, any>;
}

// Usage with typed data
const userLogger = createPlip();

const userData: UserLogData = {
  userId: 123,
  email: "user@example.com",
  action: "login",
  timestamp: new Date().toISOString()
};

userLogger.info("User action", userData);

const errorData: ErrorLogData = {
  error: "Database connection failed",
  stack: error.stack,
  context: { host: "localhost", port: 5432 }
};

userLogger.error("Database error", errorData);
```

### Logger Wrapper

```typescript
interface WrappedLogger {
  log: Logger;
  context: Record<string, any>;
}

function createWrappedLogger(context: Record<string, any>): WrappedLogger {
  return {
    log: createPlip(),
    context
  };
}

// Usage
const wrapper = createWrappedLogger({ service: "auth", version: "1.0.0" });
wrapper.log.info("Service started", wrapper.context);
```

## Type Safety Best Practices

### 1. Use Type Guards

```typescript
function logSafely(logger: unknown, message: string, data?: any): void {
  if (isPlipLogger(logger)) {
    logger.info(message, data);
  }
}
```

### 2. Constrain Configuration Types

```typescript
interface ProductionConfig extends PlipConfig {
  enableColors: false;
}

const prodConfig: ProductionConfig = {
  enableColors: false,
  enabledLevels: ['warn', 'error']
};
```

### 3. Use Generic Constraints

```typescript
function createTypedLogger<T extends Partial<PlipConfig>>(config: T): Logger {
  return createPlip(config);
}
```

## Import Types

All types are available for import:

```typescript
import type {
  Logger,
  LoggerFactory,
  PlipConfig,
  ResolvedPlipConfig,
  PlipTheme,
  ColorFn,
  LogLevel,
  LogErrorHandler,
  LogTimer,
  LogEntry,
  FormattedLogEntry,
  Transport,
  TransportConfig,
  ConsoleTransportConfig,
  FileTransportConfig,
  RemoteTransportConfig,
  BrowserTransportConfig
} from '@ru-dr/plip';
```

## Next Steps

- Explore the [Logger API](/api/logger)
- Learn about [Configuration](/api/configuration)
- Check out practical [Examples](/examples/)
