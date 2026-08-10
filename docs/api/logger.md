# Logger API

Complete API reference for Plip Logger methods and functionality.

## Logger Creation

### Factory Methods

#### `createPlip(config?: Partial<PlipConfig>): PlipLogger`

Creates a new logger instance with custom configuration.

```typescript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

### Context Methods

#### `withContext(context: Record<string, any>): PlipLogger`

Creates a logger instance with attached context that will be included in all subsequent log messages.

```typescript
const userLogger = logger.withContext({ 
  userId: "123", 
  sessionId: "abc-xyz" 
});

userLogger.info("User performed action", { action: "login" });
// Includes both the attached context and the additional data
```

#### `child(context: Record<string, any>): PlipLogger`

Alias for `withContext`. Creates a child logger that inherits the parent context and adds its own.

```typescript
const requestLogger = userLogger.child({ requestId: "req-456" });
requestLogger.info("Handling request");
```

### Configuration Methods

#### `configure(config: Partial<PlipConfig>): PlipLogger`

Returns a **new** logger with the given configuration merged in. The original logger is left unchanged.

```typescript
const quietLogger = logger.configure({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

#### `silent(): PlipLogger`

Returns a new logger with all output suppressed.

```typescript
const quiet = logger.silent(); // Suppresses all output
quiet.info("Not printed");
logger.info("Still printed");  // Original logger is unaffected
```

#### `levels(...levels: LogLevel[]): PlipLogger`

Returns a new logger whose `enabledLevels` allowlist is replaced by the given levels.

```typescript
const prodLogger = logger.levels('info', 'warn', 'error');
```

#### `minLevel(level: LogLevel): PlipLogger`

Returns a new logger with a severity threshold: levels ranked below `level` are dropped.

```typescript
const quieter = logger.minLevel('warn');

quieter.error("Payment failed");  // Logged
quieter.warn("Retrying");         // Logged
quieter.info("Request received"); // Dropped
logger.info("Still printed");     // Original logger is unaffected
```

The ranking is `trace` 10, `verbose` 20, `debug` 30, `info` 40, `success` 40, `warn` 50, `error` 60 — so `minLevel('info')` keeps `success` as well.

`minLevel` and `levels` are independent filters and intersect when both are applied:

```typescript
const logger = plip
  .levels('debug', 'info', 'warn', 'error')
  .minLevel('warn');
// Only warn and error survive
```

See [Log Levels](/guide/log-levels) for the full explanation.

### Transport Management

#### `addTransport(transport: Transport): PlipLogger`

Adds a transport to the logger.

```typescript
import { FileTransport } from '@ru-dr/plip';

const fileTransport = new FileTransport({
  name: 'file',
  filename: '/var/log/app.log'
});

logger.addTransport(fileTransport);
```

#### `removeTransport(name: string): PlipLogger`

Removes a transport by name.

```typescript
logger.removeTransport('file');
```

#### `clearTransports(): PlipLogger`

Removes all transports from the logger.

```typescript
logger.clearTransports();
```

#### `getTransports(): Transport[]`

Returns the transports currently attached to the logger.

```typescript
logger.getTransports().map(transport => transport.name);
```

#### `flush(): Promise<void>`

Resolves once every transport has drained its pending work: in-flight writes complete, and each transport that implements `flush()` is asked to drain its buffer.

This matters before the process exits. `FileTransport` queues writes and `RemoteTransport` batches entries, so without a flush the last logs can be lost:

```typescript
import { createPlip, FileTransport } from '@ru-dr/plip';

const logger = createPlip();
logger.addTransport(new FileTransport({
  name: 'file',
  filename: './logs/app.log'
}));

logger.error("Fatal startup failure");

await logger.flush();
process.exit(1);
```

Loggers derived with `child()`, `withContext()`, `configure()`, `minLevel()` and friends share the parent's transports, so flushing any of them drains the whole family.

```typescript
const requestLogger = logger.child({ requestId: 'req-456' });
await requestLogger.flush(); // Drains the same transports as logger.flush()
```

`flush()` does not reject. A transport that fails while draining reports the failure through its own `TransportConfig.onError`, falling back to `console.error`.

### Performance Methods

#### `startTimer(label?: string): LogTimer`

Starts a timer and returns a `LogTimer` (`{ label, startTime, end(message?) }`). Calling `end()` logs the elapsed time at `info` level.

```typescript
const timer = logger.startTimer('database-query');
// ... perform database operation
timer.end();
// Output: [INFO] Timer "database-query" completed in 142.00ms
```

Pass a message to `end()` to customize the output:

```typescript
const timer = logger.startTimer('api-call');
await fetch('/api/data');
timer.end('API call finished');
// Output: [INFO] API call finished (142.00ms)
```

## Factory Functions

### `createPlip(config?: Partial<PlipConfig>): PlipLogger`

Creates a new logger instance with custom configuration.

```typescript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

**Parameters**:
- `config` (optional): Configuration object of type `Partial<PlipConfig>`

**Returns**: A new `PlipLogger` instance

#### `createSSRLogger(overrides?: Partial<PlipConfig>): PlipLogger`

Creates a logger optimized for Server-Side Rendering.

```typescript
import { createSSRLogger } from '@ru-dr/plip';

const ssrLogger = createSSRLogger({
  enabledLevels: ['info', 'warn', 'error']
});
```

#### `createCSRLogger(overrides?: Partial<PlipConfig>): PlipLogger`

Creates a logger optimized for Client-Side Rendering.

```typescript
import { createCSRLogger } from '@ru-dr/plip';

const csrLogger = createCSRLogger({
  enableSyntaxHighlighting: true
});
```

### Default Logger Instances

#### `plip`

The default CSR-optimized logger instance:

```typescript
import { plip } from '@ru-dr/plip';

plip.info("Hello from Plip!");
```

#### `ssrLogger`

Pre-configured SSR logger instance:

```typescript
import { ssrLogger } from '@ru-dr/plip';

ssrLogger.info("Server processing request");
```

#### `csrLogger`

Pre-configured CSR logger instance:

```typescript
import { csrLogger } from '@ru-dr/plip';

csrLogger.info("Client-side operation completed");
```

## PlipLogger Class

### Constructor

`PlipLogger` requires a fully-resolved config, a theme, and (optionally) a context and transports. Prefer the factory functions, which fill these in for you.

```typescript
import { PlipLogger, defaultConfig, defaultTheme, ConsoleTransport } from '@ru-dr/plip';

const logger = new PlipLogger(
  defaultConfig,
  defaultTheme,
  {},
  [new ConsoleTransport({ name: 'console' })]
);
```

### Log Level Methods

#### `verbose(...args: any[]): void`

Logs verbose debugging information.

```typescript
logger.verbose("Function entered", { params: { id: 123 } });
logger.verbose("Processing item", 5, "of", 10);
```

**Output**: `[VERBOSE] Function entered { "params": { "id": 123 } }`

#### `debug(...args: any[]): void`

Logs debug information for development.

```typescript
logger.debug("Cache miss for key", { key: "user:123" });
logger.debug("Variable state:", { count: 42, active: true });
```

**Output**: `[DEBUG] Cache miss for key { "key": "user:123" }`

#### `info(...args: any[]): void`

Logs general information messages.

```typescript
logger.info("Server started on port", 3000);
logger.info("User authenticated", { userId: "123", role: "admin" });
```

**Output**: `[INFO] Server started on port 3000`

#### `success(...args: any[]): void`

Logs successful operations.

```typescript
logger.success("Database connected successfully");
logger.success("Email sent to", "user@example.com");
```

**Output**: `[SUCCESS] Database connected successfully`

#### `warn(...args: any[]): void`

Logs warning messages.

```typescript
logger.warn("API rate limit approaching", { remaining: 10 });
logger.warn("Deprecated method used:", "oldFunction()");
```

**Output**: `[WARN] API rate limit approaching { "remaining": 10 }`

#### `error(...args: any[]): void`

Logs error messages.

```typescript
logger.error("Failed to connect to database", error);
logger.error("Validation failed", { field: "email", value: "invalid" });
```

**Output**: `[ERROR] Failed to connect to database Error: Connection timeout`

#### `trace(...args: any[]): void`

Logs trace-level diagnostic information. Stack traces are not captured automatically; pass an `Error` if you want one.

```typescript
logger.trace("Execution path", { function: "processUser", line: 42 });
logger.trace("Stack trace for debugging");
```

**Output**: `[TRACE] Execution path { "function": "processUser", "line": 42 }`

## Configuration Methods

Logger configuration methods support fluent chaining:

```typescript
const customLogger = plip
  .withColors(true)
  .withSyntaxHighlighting(true)
  .withContext({ service: "api", version: "1.0" })
  .levels('info', 'warn', 'error')
  .minLevel('info');

// Context is automatically included in all logs
customLogger.info("Request processed", { endpoint: "/users" });
// Output: [INFO] Request processed {"service":"api","version":"1.0","endpoint":"/users"}

// Note: Logging methods (info, debug, etc.) do not support chaining
plip.info("Starting operation");
plip.debug("Debug information");
plip.success("Operation completed");
```

### `withContext(context: Record<string, any>): PlipLogger`

Adds persistent context to all log messages. Context is merged with any data provided to individual log calls:

```typescript
// Create a logger with persistent context
const authLogger = plip.withContext({ scope: "auth", service: "user-service" });

// Context is automatically included
authLogger.info("Login attempt"); 
// Output: [INFO] Login attempt {"scope":"auth","service":"user-service"}

authLogger.error("Login failed", { userId: 123, reason: "invalid_password" });
// Output: [ERROR] Login failed {"scope":"auth","service":"user-service","userId":123,"reason":"invalid_password"}

// Context can be extended by chaining
const requestLogger = authLogger.withContext({ requestId: "req-456" });
requestLogger.warn("Rate limit exceeded");
// Output: [WARN] Rate limit exceeded {"scope":"auth","service":"user-service","requestId":"req-456"}
```

## Data Parameter

The optional `data` parameter accepts any serializable value:

### Primitive Values

```typescript
plip.info("User age", 25);
plip.info("Is admin", true);
plip.info("Username", "alice");
```

### Objects

```typescript
plip.info("User profile", {
  id: 123,
  name: "Alice",
  email: "alice@example.com",
  preferences: {
    theme: "dark",
    notifications: true
  }
});
```

### Arrays

```typescript
plip.info("User skills", ["TypeScript", "React", "Node.js"]);
plip.info("Error codes", [404, 500, 503]);
```

### Complex Objects

```typescript
plip.info("Request details", {
  method: "POST",
  url: "/api/users",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ..."
  },
  body: { name: "Alice", email: "alice@example.com" },
  timestamp: new Date().toISOString()
});
```

## Error Handling

Plip serializes arguments with `JSON.stringify`, so ordinary values are safe to log:

```typescript
plip.info("Message", undefined);
plip.info("Message", Symbol("test"));
```

Values that `JSON.stringify` cannot handle — most notably objects containing circular references — will throw. Break the cycle (or pass a pre-serialized string) before logging them:

```typescript
// This throws: JSON.stringify cannot serialize a circular structure
// plip.info("Message", objectWithCircularReference);
```

## Performance Considerations

### Disabled Levels Are Cheap

When a level is not enabled, Plip returns before formatting or serializing anything. Note that arguments are still evaluated by JavaScript before the call, so expensive work should not be inlined in the call:

```typescript
// performExpensiveCalculation() runs even if `debug` is disabled
plip.debug("Debug info", performExpensiveCalculation());
```

### Conditional Logging

Guard expensive work with your own flag or a dedicated logger:

```typescript
const debugEnabled = process.env.DEBUG === 'true';

if (debugEnabled) {
  const debugData = generateComplexDebugInfo();
  logger.debug("Complex debug info", debugData);
}
```

## Type Safety

All methods are fully typed for TypeScript users:

```typescript
// TypeScript will catch this error
plip.invalidMethod("test"); // Error: method doesn't exist

// Log methods accept any number of arguments of any type
plip.info("Valid message", { any: "data" });
plip.info(123, true, ["a", "b"]);
```

## Usage Examples

### Basic Logging

```typescript
import { plip } from '@ru-dr/plip';

// Simple messages
plip.info("Application started");
plip.warn("Configuration missing, using defaults");

// With data
plip.info("User logged in", { userId: 123, timestamp: Date.now() });
plip.error("Login failed", { error: "Invalid credentials", attempt: 3 });
```

### Custom Logger

```typescript
import { createPlip } from '@ru-dr/plip';

const apiLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});

apiLogger.info("API request received", {
  method: "GET",
  path: "/users/123",
  userAgent: "Mozilla/5.0..."
});
```

### Service Integration

```typescript
class UserService {
  private logger = createPlip({
    enabledLevels: ['debug', 'info', 'warn', 'error']
  });

  async createUser(userData: UserData) {
    this.logger.info("Creating new user", { email: userData.email });
    
    try {
      const user = await this.database.create(userData);
      this.logger.success("User created successfully", { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error("Failed to create user", {
        email: userData.email,
        error: error.message
      });
      throw error;
    }
  }
}
```

## Next Steps

- Learn about [Configuration](/api/configuration) options
- Explore [Types](/api/types) definitions
- Check out practical [Examples](/examples/)
