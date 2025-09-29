# Configuration API

Complete API reference for Plip configuration options and types.

## PlipConfig Interface

The main configuration interface for customizing logger behavior.

```typescript
interface PlipConfig {
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

#### `enableEmojis?: boolean`

Controls whether emoji prefixes are displayed in log messages.

- **Type**: `boolean | undefined`
- **Default**: `true` (CSR), `false` (SSR)
- **Description**: When `true`, each log level displays its corresponding emoji (🫧, ⚠️, 💥, etc.)

```typescript
// Enable emojis (default for CSR)
const logger = createPlip({ enableEmojis: true });
logger.info("Hello!"); // Output: 🫧 [INFO] Hello!

// Disable emojis (default for SSR)
const cleanLogger = createPlip({ enableEmojis: false });
cleanLogger.info("Hello!"); // Output: [INFO] Hello!
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

Custom theme configuration for colors and emojis.

- **Type**: `Partial<PlipTheme> | undefined`
- **Default**: Default theme
- **Description**: Override default colors and emojis for log levels

```typescript
const logger = createPlip({
  theme: {
    emojis: { info: '📝', error: '🚨' },
    colors: { info: 'blue', error: 'red' }
  }
});
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
// Output: [2024-01-15T10:30:00.000Z] 🫧 [INFO] Server started
```

#### `enableStructuredOutput?: boolean`

Controls whether logs are formatted as structured JSON.

- **Type**: `boolean | undefined`
- **Default**: `false`
- **Description**: When `true`, outputs logs in JSON format suitable for log aggregation systems

```typescript
const logger = createPlip({ enableStructuredOutput: true });
logger.info("User action", { userId: 123 });
// Output: {"level":"info","message":"User action","context":{"userId":123},"timestamp":"..."}
```

#### `includeRequestId?: boolean`

Controls whether request IDs are automatically generated and included.

- **Type**: `boolean | undefined`
- **Default**: `false` (CSR), `true` (SSR)
- **Description**: When `true`, automatically generates and includes request correlation IDs

```typescript
const logger = createPlip({ includeRequestId: true });
logger.info("Processing request");
// Output includes requestId for correlation
```

#### `includeContext?: boolean`

Controls whether context data is included by default.

- **Type**: `boolean | undefined`
- **Default**: `false` (CSR), `true` (SSR)
- **Description**: When `true`, includes contextual information in log entries

```typescript
const logger = createPlip({ includeContext: true });
logger.withContext({ userId: 123 }).info("User logged in");
// Context is automatically included in all subsequent logs
```

**Color Scheme**:
- `verbose`: Gray
- `debug`: Blue  
- `info`: Cyan
- `success`: Green
- `warn`: Yellow
- `error`: Red
- `trace`: Cyan

#### `enabledLevels?: LogLevel[]`

Specifies which log levels are active and will produce output.

- **Type**: `LogLevel[] | undefined`
- **Default**: All levels enabled
- **Description**: Only levels included in this array will generate output

```typescript
// Only show warnings and errors
const prodLogger = createPlip({
  enabledLevels: ['warn', 'error', 'fatal']
});

// Development logger with all levels
const devLogger = createPlip({
  enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'fatal']
});

// Minimal logging
const minimalLogger = createPlip({
  enabledLevels: ['error', 'fatal']
});
```

## LogLevel Type

Enumeration of available log levels in order of severity.

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
        enableEmojis: false,
        enableColors: false,
        enabledLevels: ['warn', 'error', 'fatal']
      };
      
    case 'development':
      return {
        enableEmojis: true,
        enableColors: true,
        enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'fatal']
      };
      
    case 'test':
      return {
        enableEmojis: false,
        enableColors: false,
        enabledLevels: ['error', 'fatal']
      };
      
    default:
      return {
        enableEmojis: true,
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
    enableEmojis: process.env.PLIP_EMOJIS !== 'false',
    enableColors: process.env.PLIP_COLORS !== 'false',
    enabledLevels: process.env.PLIP_VERBOSE === 'true'
      ? ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'fatal']
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
    enableEmojis: isDevelopment && !isCI,
    enableColors: !isCI && !isDocker,
    enabledLevels: isDevelopment
      ? ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'fatal']
      : ['info', 'warn', 'error', 'fatal']
  };
};
```

## Default Configuration

When no configuration is provided, Plip uses these defaults:

```typescript
const DEFAULT_CONFIG: PlipConfig = {
  enableEmojis: true,
  enableColors: undefined, // Auto-detect
  enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'fatal']
};
```

## Configuration Validation

Plip automatically validates and sanitizes configuration:

```typescript
// Invalid configurations are handled gracefully
const logger1 = createPlip({
  enabledLevels: [] // Empty array -> falls back to default
});

const logger2 = createPlip({
  enabledLevels: ['invalid'] as any // Invalid level -> falls back to default
});

const logger3 = createPlip({
  enableEmojis: 'yes' as any // Invalid type -> converts to boolean
});
```

## Configuration Examples

### Microservice Logger

```typescript
const microserviceConfig: PlipConfig = {
  enableEmojis: false,  // Clean for container logs
  enableColors: false,  // Better for log aggregation
  enabledLevels: ['info', 'warn', 'error', 'fatal']
};

const serviceLogger = createPlip(microserviceConfig);
```

### Debug Logger

```typescript
const debugConfig: PlipConfig = {
  enableEmojis: true,
  enableColors: true,
  enabledLevels: ['verbose', 'debug'] // Only debug information
};

const debugLogger = createPlip(debugConfig);
```

### CLI Application Logger

```typescript
const cliConfig: PlipConfig = {
  enableEmojis: true,   // Visual feedback for users
  enableColors: true,   // Better UX in terminal
  enabledLevels: ['info', 'success', 'warn', 'error'] // Skip debug noise
};

const cliLogger = createPlip(cliConfig);
```

### Web Server Logger

```typescript
const serverConfig: PlipConfig = {
  enableEmojis: process.env.NODE_ENV === 'development',
  enableColors: process.stdout.isTTY,
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'warn', 'error', 'fatal']
    : ['debug', 'info', 'success', 'warn', 'error', 'fatal']
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
  enableEmojis: !isProd && !isTest,
  enableColors: isTTY && !isTest,
  enabledLevels: isProd ? ['warn', 'error', 'fatal'] : undefined
};
```

### 2. Consistent Defaults

Establish team-wide configuration standards:

```typescript
// config/logger.ts
export const STANDARD_CONFIGS = {
  development: {
    enableEmojis: true,
    enableColors: true,
    enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'fatal']
  } as PlipConfig,
  
  production: {
    enableEmojis: false,
    enableColors: false,
    enabledLevels: ['info', 'warn', 'error', 'fatal']
  } as PlipConfig,
  
  testing: {
    enableEmojis: false,
    enableColors: false,
    enabledLevels: ['error', 'fatal']
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
  enableEmojis: false,      // Clean for server logs
  enableColors: false,      // Conditional based on environment
  enableTimestamp: true,    // Important for server logs
  includeRequestId: true,   // For request correlation
  includeContext: true,     // For debugging context
  enableStructuredOutput: false
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
  enableEmojis: true,       // Rich visual experience
  enableColors: true,       // Colorful browser console
  enableTimestamp: false,   // Browser already shows time
  includeRequestId: false,  // Not needed in client
  includeContext: false,    // Less clutter
  enableSyntaxHighlighting: true
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
  level: 'info'
});

// File transport for server environments
const fileTransport = new FileTransport({
  name: 'file',
  level: 'warn',
  filePath: '/var/log/app.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
});

// Browser transport for client-side
const browserTransport = new BrowserTransport({
  name: 'browser',
  level: 'debug',
  groupSimilar: true,
  collapseGroups: false
});

// Remote transport for log aggregation
const remoteTransport = new RemoteTransport({
  name: 'remote',
  level: 'error',
  endpoint: 'https://logs.example.com/api/logs',
  apiKey: 'your-api-key',
  batchSize: 100,
  flushInterval: 5000
});
```

### Adding Transports to Logger

```typescript
import { PlipLogger } from '@ru-dr/plip';

const logger = new PlipLogger();

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
