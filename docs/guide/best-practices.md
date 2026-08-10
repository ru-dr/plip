# Best Practices

Follow these best practices to get the most out of Plip Logger and maintain clean, effective logging in your applications.

## Log Level Guidelines

### Use Appropriate Levels

Choose the right log level for each message:

```typescript
// VERBOSE - Extremely detailed debugging
plip.verbose("Processing array item", { index: i, item });

// DEBUG - Development debugging
plip.debug("Cache hit for key:", cacheKey);

// INFO - General application flow
plip.info("User authentication successful");

// SUCCESS - Positive outcomes
plip.success("Data backup completed");

// WARN - Potential issues
plip.warn("API response time exceeded threshold", { responseTime: 1500 });

// ERROR - Actual problems
plip.error("Failed to connect to database", error);

// TRACE - System tracing and diagnostics
plip.trace("Request processing completed", { requestId, duration });
```

### Level Guidelines

Understand when each level should be used:

- **VERBOSE**: Trace-level debugging, function entry/exit
- **DEBUG**: Development debugging, variable inspection
- **INFO**: Normal application flow, important events
- **SUCCESS**: Successful operations, milestones
- **WARN**: Degraded functionality, recoverable errors
- **ERROR**: Error conditions, failed operations
- **TRACE**: System tracing, diagnostics, and request tracking

### Prefer a Threshold for "and Above" Filtering

Use `minLevel` when you want the conventional cut-off, and `enabledLevels` when you genuinely want a hand-picked set:

```typescript
// Good - a threshold expresses "warn and above" directly
const logger = plip.configure({ minLevel: 'warn' });

// Also good - an allowlist for a selection a threshold cannot express
const debugOnly = plip.configure({ enabledLevels: ['verbose', 'debug', 'trace'] });
```

Remember that `success` ranks alongside `info`, so `minLevel: 'info'` keeps both. When you set both options they intersect, which is easy to over-restrict by accident - reach for one or the other unless you really need both.

## Message Formatting

### Write Clear Messages

```typescript
// Good - Clear and actionable
plip.error("Failed to authenticate user: invalid API key", {
  userId: user.id,
  keyPrefix: apiKey.substring(0, 8) + "...",
  timestamp: new Date()
});

// Poor - Vague and unhelpful
plip.error("Auth failed");
```

### Include Relevant Context

```typescript
// Good - Rich context for debugging
plip.warn("High memory usage detected", {
  currentUsage: process.memoryUsage().heapUsed,
  threshold: MEMORY_THRESHOLD,
  activeConnections: connectionPool.size,
  uptime: process.uptime()
});

// Poor - No actionable information
plip.warn("Memory warning");
```

### Use Consistent Formatting

```typescript
// Good - Consistent structure
plip.info("User action completed", {
  action: "file_upload",
  userId: user.id,
  fileName: file.name,
  fileSize: file.size,
  duration: Date.now() - startTime
});

plip.info("User action completed", {
  action: "profile_update",
  userId: user.id,
  fields: updatedFields,
  duration: Date.now() - startTime
});
```

## Error Handling

### Log Complete Error Information

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Good - Complete error context
  plip.error("Risk operation failed", {
    operation: "user_data_sync",
    userId: user.id,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    retryCount: attemptNumber,
    timestamp: new Date()
  });
}
```

### Don't Log and Rethrow Without Context

```typescript
// Poor - Logs same error multiple times
async function processPayment(payment) {
  try {
    return await chargeCard(payment);
  } catch (error) {
    plip.error("Payment failed", error); // Logged here
    throw error; // Will be logged again upstream
  }
}

// Better - Add context before rethrowing
async function processPayment(payment) {
  try {
    return await chargeCard(payment);
  } catch (error) {
    plip.error("Payment processing failed", {
      paymentId: payment.id,
      amount: payment.amount,
      originalError: error.message
    });
    throw new Error(`Payment ${payment.id} failed: ${error.message}`);
  }
}
```

### Handle Transport Failures Explicitly

Transport failures are reported rather than swallowed: they reach `onError`, or `console.error` when you have not set one. In anything running unattended, point them somewhere you will actually notice:

```typescript
const logger = plip.configure({
  onError: (error, transportName) => {
    metrics.increment('log_transport_failure', { transport: transportName });
  }
});
```

Keep the handler cheap and non-throwing, and never log through the same logger from inside it - that risks an error loop.

## Flushing Before Exit

`FileTransport` queues writes and `RemoteTransport` batches entries, so the last few logs can still be in flight when a process ends. Await `logger.flush()` before exiting:

```typescript
// Poor - the process can exit before the log reaches the file
plip.error("Fatal startup failure");
process.exit(1);

// Good - flush first
plip.error("Fatal startup failure");
await plip.flush();
process.exit(1);
```

The same applies to shutdown hooks:

```typescript
process.on('SIGTERM', async () => {
  plip.info("Shutting down");
  await server.close();
  await plip.flush();
  process.exit(0);
});
```

Loggers derived with `child()` or `withContext()` share their parent's transports, so flushing any one of them drains the whole family. With only the default console transport there is nothing to drain, and `flush()` resolves immediately - it is still safe (and cheap) to call.

## Performance Considerations

### Avoid Expensive Operations in Log Messages

```typescript
// Poor - Expensive operation always executed
plip.debug("User data:", JSON.stringify(user, null, 2));

// Better - Let Plip handle formatting
plip.debug("User data:", user);

// Good - Conditional expensive operations
if (process.env.NODE_ENV !== 'production') {
  const expensiveData = generateComplexReport();
  plip.debug("Complex report:", expensiveData);
}
```

### Compute Complex Data Only When Needed

Plip logs the arguments it is given - it does not call functions passed as
arguments - so guard expensive payloads yourself:

```typescript
// Good - Only compute when the data will actually be logged
if (process.env.NODE_ENV !== 'production') {
  plip.debug("System state:", {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    connections: getActiveConnections().length,
    uptime: process.uptime()
  });
}
```

## Environment-Specific Logging

### Development vs Production

```typescript
const isProd = process.env.NODE_ENV === 'production';

const logger = plip.configure({
  enabledLevels: isProd
    ? ['info', 'success', 'warn', 'error']
    : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace'],

  enableColors: !isProd,

  // Structured JSON lines for log aggregation, human-readable in development
  enableStructuredOutput: isProd
});
```

### Use Environment Variables

Plip itself only reads `NODE_ENV` (and the standard color variables), but you
can drive its configuration from your own environment variables:

```typescript
import type { LogLevel } from '@ru-dr/plip';

// Good - Configurable via environment
const ENABLE_DEBUG = process.env.DEBUG === 'true';

const levels: LogLevel[] = ENABLE_DEBUG
  ? ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
  : ['info', 'success', 'warn', 'error'];

const logger = plip.configure({ enabledLevels: levels });
```

## Structured Logging

### Use Consistent Object Structures

```typescript
// Good - Consistent log entry structure
const logEntry = {
  event: 'user_action',
  action: 'login',
  userId: user.id,
  timestamp: new Date().toISOString(),
  metadata: {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    sessionId: req.sessionId
  }
};

plip.info("User logged in", logEntry);
```

### Searchable Fields

```typescript
// Good - Easy to search and filter
plip.info("API request processed", {
  method: req.method,
  endpoint: req.path,
  statusCode: res.statusCode,
  duration: responseTime,
  userId: req.user?.id,
  requestId: req.id
});
```

## Security Considerations

### Never Log Sensitive Information

```typescript
// NEVER DO THIS - Exposes sensitive data
plip.info("User created", {
  email: user.email,
  password: user.password, // SECURITY RISK
  creditCard: user.paymentInfo.cardNumber // SECURITY RISK
});

// Good - Redacted sensitive information
plip.info("User created", {
  email: user.email,
  hasPassword: !!user.password,
  paymentMethodType: user.paymentInfo.type
});
```

### Sanitize User Input

```typescript
// Good - Sanitize before logging
plip.info("Search performed", {
  query: sanitizeForLogging(req.query.q),
  userId: req.user.id,
  resultCount: results.length
});

function sanitizeForLogging(input: string): string {
  return input
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .substring(0, 100); // Limit length
}
```

## Testing and Debugging

### Use Different Loggers for Different Modules

```typescript
// Good - Module-specific loggers
const authLogger = plip.withContext({ module: 'AUTH' });
const dbLogger = plip.withContext({ module: 'DB' });
const apiLogger = plip.withContext({ module: 'API' });

authLogger.info("User authenticated");
dbLogger.debug("Query executed", { query, duration });
apiLogger.warn("Rate limit approaching", { usage: '80%' });
```

### Conditional Debug Logging

```typescript
// Good - Environment-aware debug logging
const DEBUG_ENABLED = process.env.DEBUG_PAYMENTS === 'true';

if (DEBUG_ENABLED) {
  plip.debug("Payment processing steps", {
    step: 'validation',
    data: paymentData
  });
}
```

## Common Anti-Patterns to Avoid

### Don't Use Console.log

```typescript
// Avoid - No level control or formatting
console.log("Something happened");

// Use Plip instead
plip.info("Something happened");
```

### Don't Log Everything

```typescript
// Poor - Too verbose, noisy logs
plip.info("Entering function processUser");
plip.info("Validating user data");
plip.info("User data is valid");
plip.info("Saving user to database");
plip.info("User saved successfully");
plip.info("Exiting function processUser");

// Better - Focus on important events
plip.info("Processing user", { userId: user.id });
// ... processing logic ...
plip.success("User processed successfully", { 
  userId: user.id, 
  duration: Date.now() - startTime 
});
```

### Don't Use String Concatenation

```typescript
// Poor - Hard to read and maintain
plip.info("User " + user.name + " performed action " + action + " at " + new Date());

// Better - Use template literals
plip.info(`User ${user.name} performed action ${action}`, { timestamp: new Date() });

// Best - Structured data
plip.info("User action performed", {
  userName: user.name,
  action: action,
  timestamp: new Date()
});
```

## Next Steps

- [Configuration](/guide/configuration) - Advanced configuration options
- [Customization](/guide/customization-guide) - Customize Plip's appearance and behavior
- [Integration Examples](/integration/express) - See Plip in real applications