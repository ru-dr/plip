# Configuration API

Complete API reference for Plip configuration options and types.

## PlipConfig Interface

The main configuration interface for customizing logger behavior.

```typescript
interface PlipConfig {
  silent?: boolean;
  enableColors?: boolean;
  enableSyntaxHighlighting?: boolean;
  theme?: Partial<PlipTheme>;
  enabledLevels?: LogLevel[]; // Explicit allowlist of levels
  minLevel?: LogLevel; // Severity threshold; levels ranked below it are dropped
  devOnly?: boolean;
  // Enhanced configuration for better SSR/CSR support
  enableTimestamp?: boolean; // For server logs with timing information
  enableStructuredOutput?: boolean; // For JSON-formatted output suitable for log aggregation
  includeRequestId?: boolean; // For request correlation in SSR
  includeContext?: boolean; // Whether to include context by default
  onError?: LogErrorHandler; // Called when a transport throws or rejects
}
```

### Properties

#### `silent?: boolean`

Controls whether all logging output is suppressed.

- **Type**: `boolean | undefined`
- **Default**: `false`
- **Description**: When `true`, all log messages are suppressed regardless of other settings

```typescript
// Silent logger (no output)
const logger = createPlip({ silent: true });
logger.info("This won't be displayed"); // No output
```

#### `enableColors?: boolean`

Controls whether ANSI color codes are applied to log output.

- **Type**: `boolean | undefined`
- **Default**: Auto-detected based on terminal capabilities
- **Description**: When `true`, logs are colored according to their level

```typescript
// Force enable colors
const colorLogger = createPlip({ enableColors: true });

// Force disable colors
const plainLogger = createPlip({ enableColors: false });

// Auto-detect (default)
const autoLogger = createPlip({ enableColors: undefined });
```

#### `enableSyntaxHighlighting?: boolean`

Controls whether objects and complex data structures are syntax highlighted.

- **Type**: `boolean | undefined`
- **Default**: `true`
- **Description**: When `true`, objects are formatted with syntax highlighting for better readability

```typescript
const logger = createPlip({ enableSyntaxHighlighting: true });
logger.info("User data:", { id: 123, name: "John" });
// Output with colored JSON syntax highlighting
```

#### `theme?: Partial<PlipTheme>`

Custom theme configuration for colors.

- **Type**: `Partial<PlipTheme> | undefined`
- **Default**: Default theme
- **Description**: Override default colors for log levels

```typescript
import { createPlip, colors } from '@ru-dr/plip';

const logger = createPlip({
  theme: {
    colors: { info: colors.blue, error: colors.red }
  }
});
```

The `PlipTheme` type:

```typescript
type ColorFn = (text: string) => string;

interface PlipTheme {
  colors: Record<LogLevel, ColorFn>;
  dimColors: Record<LogLevel, ColorFn>;
}
```

#### `devOnly?: boolean`

Controls whether logs are only shown in development environments.

- **Type**: `boolean | undefined`
- **Default**: `false`
- **Description**: When `true`, logs are suppressed in production environments

```typescript
const logger = createPlip({ devOnly: true });
// Logs only appear when NODE_ENV !== 'production'
```

#### `enableTimestamp?: boolean`

Controls whether timestamps are included in log messages.

- **Type**: `boolean | undefined`
- **Default**: `false` (CSR), `true` (SSR)
- **Description**: When `true`, adds timestamp information to log entries

```typescript
const logger = createPlip({ enableTimestamp: true });
logger.info("Server started");
// Output: 2024-01-15T10:30:00.000Z [INFO] Server started
```

#### `enableStructuredOutput?: boolean`

Controls whether logs are formatted as structured JSON.

- **Type**: `boolean | undefined`
- **Default**: `false`
- **Description**: When `true`, outputs logs in JSON format suitable for log aggregation systems

```typescript
const logger = createPlip({ enableStructuredOutput: true });
logger.info("User action", { userId: 123 });
// Output: {"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"User action {\n  \"userId\": 123\n}"}
```

#### `includeRequestId?: boolean`

Controls whether request IDs are included on log entries.

- **Type**: `boolean | undefined`
- **Default**: `false` (CSR), `true` (SSR)
- **Description**: When `true`, every entry carries a `requestId` for correlation

The id is resolved as follows: a `requestId` in the logger's context always wins, so you can correlate a real request by attaching it yourself. If the context has no `requestId`, Plip generates one **per logger instance** — using `crypto.randomUUID()` where available — and reuses it for every entry from that logger.

```typescript
const logger = createPlip({ includeRequestId: true });

// Generated once for this logger instance and reused
logger.info("Processing request");

// A per-request id: create a child logger for each request
const requestLogger = logger.child({ requestId: req.headers['x-request-id'] });
requestLogger.info("Handling request"); // Uses the id from context
```

#### `includeContext?: boolean`

Controls whether context data is included by default.

- **Type**: `boolean | undefined`
- **Default**: `true`
- **Description**: When `true`, includes contextual information in log entries

```typescript
const logger = createPlip({ includeContext: true });
logger.withContext({ userId: 123 }).info("User logged in");
// Context is automatically included in all subsequent logs
```

**Color Scheme**:
- `verbose`: Gray
- `debug`: Magenta
- `info`: Cyan
- `success`: Green
- `warn`: Yellow
- `error`: Red
- `trace`: Blue

#### `enabledLevels?: LogLevel[]`

Specifies which log levels are active and will produce output.

- **Type**: `LogLevel[] | undefined`
- **Default**: All levels enabled
- **Description**: Only levels included in this array will generate output

```typescript
// Only show warnings and errors
const prodLogger = createPlip({
  enabledLevels: ['warn', 'error']
});

// Development logger with all levels
const devLogger = createPlip({
  enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});

// Minimal logging
const minimalLogger = createPlip({
  enabledLevels: ['error']
});
```

`enabledLevels` is not hierarchical: listing `error` does not implicitly enable `warn`. For the conventional "warn and above" behaviour, use `minLevel`.

#### `minLevel?: LogLevel`

A severity threshold. Levels ranked below it are dropped.

- **Type**: `LogLevel | undefined`
- **Default**: unset (no threshold)
- **Description**: Combined with `enabledLevels` when both are set — a message must pass both filters

```typescript
// warn and above
const logger = createPlip({ minLevel: 'warn' });

logger.warn("Retrying");         // Logged
logger.info("Request received"); // Dropped

// Intersects with enabledLevels
const intersected = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error'],
  minLevel: 'warn'
});
// Only warn and error survive
```

The severity ranking is `trace` 10, `verbose` 20, `debug` 30, `info` 40, `success` 40, `warn` 50, `error` 60. `success` shares a rank with `info` on purpose. See [Log Levels](/guide/log-levels) for the full explanation.

#### `onError?: LogErrorHandler`

Receives transport delivery failures.

- **Type**: `((error: unknown, transportName: string) => void) | undefined`
- **Default**: unset — failures are reported with `console.error`
- **Description**: Called whenever a transport throws or rejects while handling an entry

Transport failures are never swallowed. A failing transport does not stop the others, and it does not fail silently either.

```typescript
const logger = createPlip({
  onError: (error, transportName) => {
    metrics.increment('log_transport_failure', { transport: transportName });
  }
});
```

A transport can also carry its own handler via `TransportConfig.onError`, which takes precedence for failures it reports itself:

```typescript
import { RemoteTransport } from '@ru-dr/plip';

logger.addTransport(new RemoteTransport({
  name: 'remote',
  url: 'https://logs.example.com/api/logs',
  onError: (error) => console.warn('Remote log delivery failed:', error)
}));
```

Keep the handler cheap and non-throwing, and never log back through the same logger — that risks an error loop.

## LogLevel Type

Union type of the available log levels.

```typescript
type LogLevel = 'verbose' | 'debug' | 'info' | 'success' | 'warn' | 'error' | 'trace';
```

### Level Descriptions

| Level | Purpose | Use Case |
|-------|---------|----------|
| `verbose` | Detailed debugging | Function tracing, variable dumps |
| `debug` | Development debugging | Development-time information |
| `info` | General information | Normal operation status |
| `success` | Success messages | Completion confirmations |
| `warn` | Warning conditions | Recoverable issues, deprecations |
| `error` | Error conditions | Handled errors, failures |
| `trace` | System tracing | Request tracking and diagnostics |

## Configuration Patterns

### Environment-Based Configuration

```typescript
const createEnvironmentConfig = (): PlipConfig => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'production':
      return {
        enableColors: false,
        enabledLevels: ['warn', 'error']
      };
      
    case 'development':
      return {
        enableColors: true,
        enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
      };
      
    case 'test':
      return {
        enableColors: false,
        enabledLevels: ['error']
      };
      
    default:
      return {
        enableColors: true,
        enabledLevels: ['info', 'warn', 'error']
      };
  }
};

const logger = createPlip(createEnvironmentConfig());
```

### Feature Flag Configuration

```typescript
const createFeatureConfig = (): PlipConfig => {
  return {
    enableColors: process.env.PLIP_COLORS !== 'false',
    enabledLevels: process.env.PLIP_VERBOSE === 'true'
      ? ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
      : ['info', 'warn', 'error']
  };
};
```

### Conditional Configuration

```typescript
const createConditionalConfig = (options: {
  isDevelopment: boolean;
  isCI: boolean;
  isDocker: boolean;
}): PlipConfig => {
  const { isDevelopment, isCI, isDocker } = options;
  
  return {
    enableColors: !isCI && !isDocker,
    enabledLevels: isDevelopment
      ? ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
      : ['info', 'warn', 'error']
  };
};
```

## Default Configuration

When no configuration is provided, Plip uses these defaults:

```typescript
const DEFAULT_CONFIG: ResolvedPlipConfig = {
  silent: false,
  enableColors: true, // Combined with terminal color auto-detection
  enableSyntaxHighlighting: true,
  theme: {},
  enabledLevels: ['info', 'warn', 'error', 'success', 'debug', 'trace', 'verbose'],
  devOnly: false,
  enableTimestamp: false,
  enableStructuredOutput: false,
  includeRequestId: false,
  includeContext: true
};
```

This object is exported as `defaultConfig`. `minLevel` and `onError` are absent because "unset" is meaningful for both: no threshold, and `console.error` reporting respectively. That is what `ResolvedPlipConfig` expresses — every presentation option resolved, those two still optional.

## Configuration Handling

Plip does not validate configuration at runtime — the values you pass are used as given, so rely on TypeScript to catch mistakes:

```typescript
// An empty array disables every level (it is not replaced by a default)
const silentByLevels = createPlip({
  enabledLevels: []
});

// Only keys of PlipConfig are read; unknown keys are ignored
const logger = createPlip({
  enabledLevels: ['info', 'warn', 'error']
});
```

## Configuration Examples

### Microservice Logger

```typescript
const microserviceConfig: PlipConfig = {
  enableColors: false,  // Better for log aggregation
  enabledLevels: ['info', 'warn', 'error']
};

const serviceLogger = createPlip(microserviceConfig);
```

### Debug Logger

```typescript
const debugConfig: PlipConfig = {
  enableColors: true,
  enabledLevels: ['verbose', 'debug'] // Only debug information
};

const debugLogger = createPlip(debugConfig);
```

### CLI Application Logger

```typescript
const cliConfig: PlipConfig = {
  enableColors: true,   // Better UX in terminal
  enabledLevels: ['info', 'success', 'warn', 'error'] // Skip debug noise
};

const cliLogger = createPlip(cliConfig);
```

### Web Server Logger

```typescript
const serverConfig: PlipConfig = {
  enableColors: process.stdout.isTTY,
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'warn', 'error']
    : ['debug', 'info', 'success', 'warn', 'error']
};

const serverLogger = createPlip(serverConfig);
```

## Configuration Best Practices

### 1. Environment Awareness

Always consider your deployment environment:

```typescript
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isTTY = process.stdout.isTTY;

const config: PlipConfig = {
  enableColors: isTTY && !isTest,
  enabledLevels: isProd ? ['warn', 'error'] : undefined
};
```

### 2. Consistent Defaults

Establish team-wide configuration standards:

```typescript
// config/logger.ts
export const STANDARD_CONFIGS = {
  development: {
    enableColors: true,
    enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
  } as PlipConfig,
  
  production: {
    enableColors: false,
    enabledLevels: ['info', 'warn', 'error']
  } as PlipConfig,
  
  testing: {
    enableColors: false,
    enabledLevels: ['error']
  } as PlipConfig
} as const;
```

### 3. Environment-Based Level Selection

Choose appropriate levels for different environments:

```typescript
const getLevelsForEnvironment = (env: string): LogLevel[] => {
  switch (env) {
    case 'development': 
      return ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace'];
    case 'staging': 
      return ['info', 'success', 'warn', 'error', 'trace']; 
    case 'production': 
      return ['warn', 'error', 'trace'];
    default: 
      return ['info', 'warn', 'error'];
  }
};
```

## SSR/CSR Configuration

Plip provides optimized configurations for Server-Side Rendering (SSR) and Client-Side Rendering (CSR) environments.

### SSR Configuration

```typescript
import { ssrConfig, createSSRLogger } from '@ru-dr/plip';

// Pre-configured SSR settings
const ssrLogger = createSSRLogger();

// Or customize SSR config
const customSSRLogger = createSSRLogger({
  enabledLevels: ['info', 'warn', 'error']
});

// SSR config defaults:
const ssrDefaults = {
  enableColors: !isProduction,        // Colors in development only
  enableTimestamp: true,              // Important for server logs
  includeRequestId: true,             // For request correlation
  includeContext: true,               // For debugging context
  enableStructuredOutput: isProduction, // JSON lines in production
  enabledLevels: isProduction ? [] : allLevels // Opt in explicitly in production
};
```

### CSR Configuration

```typescript
import { csrConfig, createCSRLogger } from '@ru-dr/plip';

// Pre-configured CSR settings
const csrLogger = createCSRLogger();

// Or customize CSR config
const customCSRLogger = createCSRLogger({
  enableSyntaxHighlighting: true
});

// CSR config defaults:
const csrDefaults = {
  enableColors: true,       // Colorful browser console
  enableTimestamp: false,   // Browser already shows time
  includeRequestId: false,  // Not needed in client
  includeContext: true,     // Useful for debugging
  enableSyntaxHighlighting: true,
  enabledLevels: isProduction ? [] : allLevels // Opt in explicitly in production
};
```

### Auto-Detection

```typescript
import { getAutoConfig } from '@ru-dr/plip';

// Automatically detects environment and applies appropriate config
const autoConfig = getAutoConfig();
const logger = createPlip(autoConfig);
```

## Transport System Configuration

Configure how and where logs are sent using the transport system.

### Transport Types

```typescript
import { 
  ConsoleTransport, 
  FileTransport, 
  BrowserTransport, 
  RemoteTransport 
} from '@ru-dr/plip';

// Console transport (default)
const consoleTransport = new ConsoleTransport({
  name: 'console',
  level: ['info', 'warn', 'error']
});

// File transport for server environments
const fileTransport = new FileTransport({
  name: 'file',
  level: ['warn', 'error'],
  filename: '/var/log/app.log',
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
});

// Browser transport for client-side
const browserTransport = new BrowserTransport({
  name: 'browser',
  level: ['debug', 'info', 'warn', 'error'],
  useLocalStorage: true,
  enableConsoleGroup: true
});

// Remote transport for log aggregation
const remoteTransport = new RemoteTransport({
  name: 'remote',
  level: ['error'],
  url: 'https://logs.example.com/api/logs',
  apiKey: 'your-api-key',
  batchSize: 100,
  flushInterval: 5000
});
```

### Adding Transports to Logger

```typescript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();

// Add multiple transports
logger.addTransport(consoleTransport);
logger.addTransport(fileTransport);
logger.addTransport(remoteTransport);

// Remove transport
logger.removeTransport('file');

// Clear all transports
logger.clearTransports();
```

## Next Steps

- Learn about [Types](/api/types) definitions
- Explore the [Logger API](/api/logger) 
- Check out [Transport System](/api/transports) guide
- See [SSR/CSR Examples](/examples/ssr-csr-quickstart)
