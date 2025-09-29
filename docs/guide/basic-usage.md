# Basic Usage

Learn the fundamentals of using Plip Logger in your applications.

## Quick Start

### Default Logger

Start with the default logger instance:

```typescript
import { plip } from '@ru-dr/plip';

plip.info("Application started");
plip.success("Database connected successfully");
plip.warn("API rate limit approaching");
plip.error("Failed to send email");
```

### Custom Logger

Create a custom logger with your preferred configuration:

```typescript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip({
  enableEmojis: true,
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});

logger.info("Custom logger created");
```

## Log Levels

Plip provides 7 log levels, each with distinct colors and emojis:

```typescript
// Detailed debugging information
logger.verbose("Processing request details...");

// Debug information for development
logger.debug("Variable value:", someVariable);

// General information messages
logger.info("User logged in");

// Success and completion messages
plip.success("File uploaded successfully");

// Warning messages for potential issues
plip.warn("Memory usage is high");

// Error messages for failures
plip.error("Payment processing failed");

// Trace information for detailed debugging
plip.trace("Function execution trace");
```

## Logging Objects and Data

Plip excels at displaying complex data structures with beautiful formatting:

```typescript
const user = {
  id: 123,
  name: "Alice Johnson",
  email: "alice@example.com",
  roles: ["user", "admin"],
  settings: {
    theme: "dark",
    notifications: true,
    language: "en"
  }
};

logger.info("User profile:", user);

// Multiple arguments are handled gracefully
logger.info("Processing user", user.id, "with role", user.roles[0]);
```

## Context Logging

Add persistent context to your logs for better traceability:

```typescript
// Create a logger with context
const userLogger = logger.withContext({
  userId: "123",
  sessionId: "abc-xyz-789",
  requestId: "req_456"
});

// All subsequent logs will include this context
userLogger.info("User action performed", { action: "login" });
userLogger.warn("Rate limit warning", { attempts: 5 });

// Clear context when needed
const cleanLogger = userLogger.clearContext();
cleanLogger.info("Context cleared");
```

## SSR vs CSR Usage

### Server-Side Rendering (SSR)

For server environments, use the SSR-optimized logger:

```typescript
import { createSSRLogger, ssrLogger } from '@ru-dr/plip';

// Use pre-configured SSR logger
ssrLogger.info("Server processing request");

// Or create custom SSR logger
const customSSRLogger = createSSRLogger({
  enabledLevels: ['info', 'warn', 'error'],
  enableTimestamp: true,
  includeRequestId: true
});

customSSRLogger.info("Custom SSR logger initialized");
```

**SSR Features:**
- Clean output without emojis (better for log files)
- Timestamps for chronological tracking
- Request ID correlation
- Structured output support for log aggregation

### Client-Side Rendering (CSR)

For browser environments, use the CSR-optimized logger:

```typescript
import { createCSRLogger, csrLogger } from '@ru-dr/plip';

// Use pre-configured CSR logger
csrLogger.info("Client-side operation completed");

// Or create custom CSR logger
const customCSRLogger = createCSRLogger({
  enableSyntaxHighlighting: true,
  enableColors: true
});

customCSRLogger.info("Custom CSR logger initialized");
```

**CSR Features:**
- Rich visual experience with emojis and colors
- Syntax highlighting for better readability
- Browser console optimization
- Reduced clutter (no timestamps or request IDs)

## Performance Timing

Track execution time of operations:

```typescript
// Start a timer
logger.time('database-query');

// Perform your operation
const users = await db.users.findMany();

// End the timer and log the duration
logger.timeEnd('database-query');
// Output: ⏱️ [TIMER] database-query: 142ms

// Measure function execution
const result = await logger.measure('api-call', async () => {
  return await fetch('/api/data').then(r => r.json());
});
// Automatically logs: ⏱️ [TIMER] api-call: 89ms
```

## Transport System

Control where your logs go with transports:

```typescript
import { FileTransport, RemoteTransport } from '@ru-dr/plip';

// Add file logging for server environments
const fileTransport = new FileTransport({
  name: 'file',
  filename: '/var/log/app.log',
  level: ['warn', 'error'] // Only log warnings and errors to file
});

logger.addTransport(fileTransport);

// Add remote logging for error tracking
const remoteTransport = new RemoteTransport({
  name: 'remote',
  url: 'https://logs.example.com/api/logs',
  level: ['error'], // Only send errors to remote service
  batchSize: 10,
  flushInterval: 5000,
  headers: { 'Authorization': 'Bearer your-api-key' }
});

logger.addTransport(remoteTransport);

// Now logs go to console, file, and remote service based on levels
logger.info("This goes to console only");
logger.warn("This goes to console and file");
logger.error("This goes to console, file, and remote service");
```

// Arrays are also beautifully formatted
const tasks = [
  { id: 1, title: "Complete documentation", done: true },
  { id: 2, title: "Write tests", done: false },
  { id: 3, title: "Deploy to production", done: false }
];

plip.debug("Current tasks:", tasks);
```

## String Interpolation

Use template literals and multiple arguments:

```typescript
const username = "alice";
const count = 42;

// Template literals
plip.info(`Welcome back, ${username}! You have ${count} notifications.`);

// Multiple arguments
plip.info("User:", username, "Notifications:", count);

// Mixed data types
plip.debug("Processing", count, "items for user", { name: username });
```

## Error Logging

Properly log errors with stack traces:

```typescript
try {
  // Some operation that might fail
  throw new Error("Something went wrong");
} catch (error) {
  // Log the error with full details
  plip.error("Operation failed:", error);
  
  // Or just the error object
  plip.error(error);
}
```

## Context-Aware Logging

Add persistent context to your logs using the `withContext()` method:

```typescript
// Create loggers with persistent context
const authLogger = plip.withContext({ scope: "auth" });
const dbLogger = plip.withContext({ scope: "database", pool: "primary" });

// Context is automatically included in all logs
authLogger.info("User login attempt", { userId: 123 });
// Output: 🫧 [INFO] User login attempt {"scope":"auth","userId":123}

dbLogger.warn("High connection count", { activeConnections: 45 });
// Output: ⚠️ [WARN] High connection count {"scope":"database","pool":"primary","activeConnections":45}

// Context can be extended by chaining
const requestLogger = authLogger.withContext({ requestId: "req-789" });
requestLogger.success("Request completed", { duration: "150ms" });
// Output: 🎉 [SUCCESS] Request completed {"scope":"auth","requestId":"req-789","duration":"150ms"}
```

### Use Cases for Context Logging

- **Service identification**: Track which service generated the log
- **Request tracing**: Follow requests across your application
- **User tracking**: Include user context in relevant logs
- **Environment info**: Add environment/version information

```typescript
// Service-specific loggers
const paymentLogger = plip.withContext({ service: "payment-service", version: "2.1.0" });
const notificationLogger = plip.withContext({ service: "notification-service", version: "1.4.2" });

// Request-scoped logging in Express middleware
app.use((req, res, next) => {
  req.logger = plip.withContext({ 
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    method: req.method,
    path: req.path
  });
  next();
});

// Usage in route handlers
app.get('/users/:id', (req, res) => {
  req.logger.info("Fetching user", { userId: req.params.id });
  // Auto includes: requestId, method, path, userId
});
```

## Conditional Logging

Use conditional logging for different environments:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  plip.debug("Debug info only shown in development");
}

// Or use the verbose level which is typically disabled in production
plip.verbose("Detailed trace information");
```

## Async Operations

Log async operations with proper context:

```typescript
async function fetchUserData(userId: string) {
  plip.info("Fetching user data for:", userId);
  
  try {
    const response = await fetch(`/api/users/${userId}`);
    const userData = await response.json();
    
    plip.success("User data fetched successfully");
    plip.debug("User data:", userData);
    
    return userData;
  } catch (error) {
    plip.error("Failed to fetch user data:", error);
    throw error;
  }
}
```

## Best Practices

### Use Appropriate Log Levels

```typescript
// ✅ Good - Appropriate level usage
plip.info("Server starting on port 3000");
plip.warn("Deprecated API endpoint used");
plip.error("Database query failed");

// ❌ Avoid - Wrong level usage
plip.error("Server starting on port 3000"); // Not an error
plip.info("Critical security breach"); // Too low level
```

### Include Context

```typescript
// ✅ Good - Includes relevant context
plip.error("Failed to process payment", {
  userId: user.id,
  amount: payment.amount,
  errorCode: error.code
});

// ❌ Poor - Lacks context
plip.error("Payment failed");
```

### Use Descriptive Messages

```typescript
// ✅ Good - Clear and descriptive
plip.info("Email notification sent to user", {
  recipient: user.email,
  template: "welcome",
  deliveryTime: new Date()
});

// ❌ Poor - Vague message
plip.info("Email sent");
```

## Next Steps

- [Custom Loggers](/examples/custom-loggers) - **Context-aware logging** with `withContext()` and advanced patterns
- [Configuration](/guide/configuration) - Customize Plip's behavior
- [Log Levels](/guide/log-levels) - Deep dive into log levels
- [Best Practices](/guide/best-practices) - Advanced logging patterns