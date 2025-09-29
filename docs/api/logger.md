# Logger API

Complete API reference for Plip Logger methods and functionality.

## Logger Creation

### Factory Methods

#### `createPlip(config?: PlipConfi**Output**: `🔬 [TRACE] Execution path { "function": "processUser", "line": 42 }`

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

#### `clearContext(): PlipLogger`

Removes all attached context from the logger.

```typescript
const cleanLogger = userLogger.clearContext();
cleanLogger.info("Context cleared"); // No context included
```

### Configuration Methods

#### `configure(config: Partial<PlipConfig>): PlipLogger`

Updates the logger configuration.

```typescript
logger.configure({
  enableEmojis: false,
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

#### `silent(enabled: boolean = true): PlipLogger`

Enables or disables silent mode.

```typescript
logger.silent(true);   // Suppress all output
logger.silent(false);  // Re-enable output
```

### Transport Management

#### `addTransport(transport: BaseTransport): PlipLogger`

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

### Performance Methods

#### `time(label: string): void`

Starts a timer with the given label.

```typescript
logger.time('database-query');
// ... perform database operation
logger.timeEnd('database-query');
```

#### `timeEnd(label: string): void`

Ends a timer and logs the elapsed time.

```typescript
logger.time('api-call');
await fetch('/api/data');
logger.timeEnd('api-call');
// Output: ⏱️ [TIMER] api-call: 142ms
```

## Factory Functions PlipLogger`

Creates a new logger instance with custom configuration.

```typescript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip({
  enableEmojis: true,
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

#### `createSSRLogger(overrides?: PlipConfig): PlipLogger`

Creates a logger optimized for Server-Side Rendering.

```typescript
import { createSSRLogger } from '@ru-dr/plip';

const ssrLogger = createSSRLogger({
  enabledLevels: ['info', 'warn', 'error']
});
```

#### `createCSRLogger(overrides?: PlipConfig): PlipLogger`

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

```typescript
import { PlipLogger } from '@ru-dr/plip';

const logger = new PlipLogger(config?: PlipConfig);
```

### Log Level Methods

#### `verbose(message: string, ...args: any[]): void`

Logs verbose debugging information.

```typescript
logger.verbose("Function entered", { params: { id: 123 } });
logger.verbose("Processing item", 5, "of", 10);
```

**Output**: `🔍 [VERBOSE] Function entered { "params": { "id": 123 } }`

#### `debug(message: string, ...args: any[]): void`

Logs debug information for development.

```typescript
logger.debug("Cache miss for key", { key: "user:123" });
logger.debug("Variable state:", { count: 42, active: true });
```

**Output**: `� [DEBUG] Cache miss for key { "key": "user:123" }`

#### `info(message: string, ...args: any[]): void`

Logs general information messages.

```typescript
logger.info("Server started on port", 3000);
logger.info("User authenticated", { userId: "123", role: "admin" });
```

**Output**: `🫧 [INFO] Server started on port 3000`

#### `success(message: string, ...args: any[]): void`

Logs successful operations.

```typescript
logger.success("Database connected successfully");
logger.success("Email sent to", "user@example.com");
```

**Output**: `✅ [SUCCESS] Database connected successfully`

#### `warn(message: string, ...args: any[]): void`

Logs warning messages.

```typescript
logger.warn("API rate limit approaching", { remaining: 10 });
logger.warn("Deprecated method used:", "oldFunction()");
```

**Output**: `⚠️ [WARN] API rate limit approaching { "remaining": 10 }`

#### `error(message: string, ...args: any[]): void`

Logs error messages.

```typescript
logger.error("Failed to connect to database", error);
logger.error("Validation failed", { field: "email", value: "invalid" });
```

**Output**: `💥 [ERROR] Failed to connect to database Error: Connection timeout`

#### `trace(message: string, ...args: any[]): void`

Logs trace information with stack traces.

```typescript
logger.trace("Execution path", { function: "processUser", line: 42 });
logger.trace("Stack trace for debugging");
```

**Output**: `� [TRACE] Execution path { "function": "processUser", "line": 42 }`

## Factory Functions

### `createPlip(config?: PlipConfig): PlipLogger`

Creates a new logger instance with custom configuration.

```typescript
import { createPlip } from '@ru-dr/plip';

const customLogger = createPlip({
  enableEmojis: true,
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});
```

**Parameters**:
- `config` (optional): Configuration object of type `PlipConfig`

**Returns**: A new `PlipLogger` instance

## Logger Instance Properties

### `config: PlipConfig`

Read-only access to the logger's current configuration:

```typescript
const logger = createPlip({ enableEmojis: true });
console.log(logger.config.enableEmojis); // true
```

## Configuration Methods

Logger configuration methods support fluent chaining:

```typescript
const customLogger = plip
  .withEmojis(true)
  .withColors(true)
  .withSyntaxHighlighting(true)
  .withContext({ service: "api", version: "1.0" })
  .levels('info', 'warn', 'error');

// Context is automatically included in all logs
customLogger.info("Request processed", { endpoint: "/users" });
// Output: 🫧 [INFO] Request processed {"service":"api","version":"1.0","endpoint":"/users"}

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
// Output: 🫧 [INFO] Login attempt {"scope":"auth","service":"user-service"}

authLogger.error("Login failed", { userId: 123, reason: "invalid_password" });
// Output: 💥 [ERROR] Login failed {"scope":"auth","service":"user-service","userId":123,"reason":"invalid_password"}

// Context can be extended by chaining
const requestLogger = authLogger.withContext({ requestId: "req-456" });
requestLogger.warn("Rate limit exceeded");
// Output: ⚠️ [WARN] Rate limit exceeded {"scope":"auth","service":"user-service","requestId":"req-456"}
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

Plip handles logging errors gracefully and never throws exceptions:

```typescript
// These won't crash your application
plip.info("Message", { circular: /* circular reference */ });
plip.info("Message", undefined);
plip.info("Message", Symbol("test"));
```

## Performance Considerations

### Lazy Evaluation

Log data is only processed when the log level is enabled:

```typescript
const expensiveData = () => {
  // This only runs if debug level is enabled
  return performExpensiveCalculation();
};

plip.debug("Debug info", expensiveData());
```

### Conditional Logging

Check if a level is enabled before expensive operations:

```typescript
if (logger.isLevelEnabled('debug')) {
  const debugData = generateComplexDebugInfo();
  logger.debug("Complex debug info", debugData);
}
```

## Type Safety

All methods are fully typed for TypeScript users:

```typescript
// TypeScript will catch these errors
plip.info(123); // Error: message must be string
plip.invalidMethod("test"); // Error: method doesn't exist

// Proper usage
plip.info("Valid message", { any: "data" }); // ✓
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
  enableEmojis: true,
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
    enableEmojis: true,
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
