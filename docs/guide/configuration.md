# Configuration

Plip offers flexible configuration options to tailor the logging experience to your needs.

## Default Logger Configuration

The default `plip` logger comes pre-configured with sensible defaults:

```typescript
import { plip } from '@ru-dr/plip';

// Use immediately - no configuration needed!
plip.info("Ready to go!");
```

## Creating Custom Loggers

For more control, create your own logger instance:

```typescript
import { createPlip } from '@ru-dr/plip';

const customLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

## Configuration Options

### PlipConfig Interface

```typescript
interface PlipConfig {
  silent?: boolean;                    // Disable all logging output
  enableColors?: boolean;              // Enable/disable color output
  enableSyntaxHighlighting?: boolean;  // Enable/disable object syntax highlighting
  theme?: Partial<PlipTheme>;          // Custom theme configuration
  enabledLevels?: LogLevel[];          // Explicit allowlist of enabled log levels
  minLevel?: LogLevel;                 // Severity threshold; levels below it are dropped
  devOnly?: boolean;                   // Only log in development environment
  onError?: LogErrorHandler;           // Called when a transport throws or rejects
}
```

`enabledLevels` and `minLevel` are independent filters, and intersect when both are set. See [Log Levels](/guide/log-levels) for the difference.

### Available Log Levels

```typescript
type LogLevel = 'verbose' | 'debug' | 'info' | 'success' | 'warn' | 'error' | 'trace';
```

## Configuration Examples

### Production Logger

Optimized for production environments:

```typescript
const prodLogger = createPlip({
  silent: false,              // Allow logging but be selective
  enableColors: false,        // Better for file logging
  enableSyntaxHighlighting: false, // Simpler output
  enabledLevels: ['info', 'warn', 'error']
});
```

### Development Logger

Enhanced for development experience:

```typescript
const devLogger = createPlip({
  enableColors: true,         // Beautiful output
  enableSyntaxHighlighting: true, // Rich object formatting
  enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});
```

### Minimal Logger

Only essential messages:

```typescript
const minimalLogger = createPlip({
  enableColors: false,
  enableSyntaxHighlighting: false,
  enabledLevels: ['error']
});
```

### Debug-Only Logger

For troubleshooting. This is a case only the allowlist can express, since it excludes the *more* severe levels:

```typescript
const debugLogger = createPlip({
  enableColors: true,
  enableSyntaxHighlighting: true,
  enabledLevels: ['verbose', 'debug', 'trace']
});
```

### Threshold Logger

For the conventional "warn and above" behaviour, use `minLevel` instead of listing levels:

```typescript
const thresholdLogger = createPlip({
  minLevel: 'warn' // Keeps warn and error
});
```

There is also a chainable form, which returns a new logger:

```typescript
const quieter = thresholdLogger.minLevel('error');
```

### Reporting Transport Failures

`onError` receives any error a transport throws or rejects with. Without it, failures are reported with `console.error` — they are never silently dropped:

```typescript
const logger = createPlip({
  onError: (error, transportName) => {
    metrics.increment('log_transport_failure', { transport: transportName });
  }
});
```

Individual transports accept their own `onError` too, via `TransportConfig`.

## Runtime Configuration

`configure()` returns a **new** logger with the merged configuration - the original instance is left untouched:

```typescript
import { plip } from '@ru-dr/plip';

// Derive a reconfigured logger
const colorfulPlip = plip.configure({
  enableColors: true
});

colorfulPlip.info("Colors enabled");
```

## Environment-Based Configuration

Configure based on environment variables:

```typescript
const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = createPlip({
  enableColors: !isTest,
  enabledLevels: isProd 
    ? ['info', 'warn', 'error']
    : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});
```

## Multiple Logger Instances

Create specialized loggers for different parts of your application:

```typescript
// Database logger
const dbLogger = createPlip({
  enableColors: true,
  enabledLevels: ['debug', 'info', 'error']
});

// API logger
const apiLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});

// Security logger
const securityLogger = createPlip({
  enableColors: false,
  enabledLevels: ['warn', 'error']
});
```

## Configuration Best Practices

### 1. Environment Awareness
Always consider your deployment environment when configuring loggers.

### 2. Level Management
Use appropriate log levels for different environments. "And above" selections are what `minLevel` is for:
- **Development**: All levels enabled (`minLevel: 'trace'`, or simply leave it unset)
- **Staging**: `minLevel: 'info'`
- **Production**: `minLevel: 'warn'`

### 3. Color Considerations
- Enable colors for local development
- Disable colors for file logging and CI/CD
- Let Plip auto-detect in most cases

## Advanced Configuration

### Conditional Configuration

```typescript
const getLoggerConfig = (): PlipConfig => {
  const config: PlipConfig = {
    enableColors: true,
    enabledLevels: ['info', 'warn', 'error']
  };
  // Modify based on environment
  if (process.env.NODE_ENV === 'production') {
    config.enabledLevels = ['warn', 'error'];
  }

  if (process.env.CI) {
    config.enableColors = false;
  }

  return config;
};

const logger = createPlip(getLoggerConfig());
```

### Configuration Validation

```typescript
const validateConfig = (config: PlipConfig): PlipConfig => {
  const validated = { ...config };
  
  // Ensure at least one log level is enabled
  if (!validated.enabledLevels || validated.enabledLevels.length === 0) {
    validated.enabledLevels = ['info', 'warn', 'error'];
  }
  
  return validated;
};

const logger = createPlip(validateConfig({
  enableColors: true,
  enabledLevels: []
}));
```

## Next Steps

- Learn about [Log Levels](/guide/log-levels) in detail
- Explore [Customization](/guide/customization-guide) options
- Check out configuration [Examples](/examples/custom-loggers)
- Discover [Transports](/api/transports) for multi-destination logging
