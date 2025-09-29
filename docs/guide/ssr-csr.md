# SSR vs CSR Logging

Plip Logger provides optimized configurations for both **Server-Side Rendering (SSR)** and **Client-Side Rendering (CSR)** environments, each tailored for their specific use cases and performance requirements.

## Quick Start

```typescript
import { createSSRLogger, createCSRLogger, ssrLogger, csrLogger } from '@ru-dr/plip';

// Use pre-configured instances
ssrLogger.info("Server-side message"); // Optimized for server logs
csrLogger.info("Client-side message"); // Optimized for browser console

// Or create custom instances
const serverLogger = createSSRLogger();
const clientLogger = createCSRLogger();
```

## Default Behavior

The main `plip` instance uses **CSR configuration** by default for the best modern web development experience:

```typescript
import { plip } from '@ru-dr/plip';

// Uses CSR config by default (rich visual experience)
plip.info("This message uses CSR optimization");

// For server-specific logging, use dedicated SSR loggers
import { ssrLogger } from '@ru-dr/plip';
ssrLogger.info("This message is optimized for server environments");
```

## SSR (Server-Side Rendering) Configuration

**Optimized for server environments, log files, and production monitoring.**

### Features:
- 🚫 **No emojis** - Clean, professional server logs suitable for log files
- � **Conditional colors** - Colors only in interactive terminals, plain text in log files
- ⏰ **Timestamps** - Essential timing information for server operations
- � **Request correlation** - Automatic request ID generation for distributed tracing
- � **Context tracking** - Enhanced debugging information for server operations
- 📋 **Structured output support** - Ready for JSON formatting and log aggregation

### Usage:

```typescript
import { createSSRLogger, ssrLogger } from '@ru-dr/plip';

// Use pre-configured instance
ssrLogger.info("Server started", { port: 3000, env: "production" });
// Output: [2024-01-15T10:30:00.000Z] [INFO] Server started {"port":3000,"env":"production"}
ssrLogger.error("Database connection failed", { host: "localhost", error: "ECONNREFUSED" });

// Create custom SSR logger with overrides
const customServerLogger = createSSRLogger({
  enabledLevels: ["warn", "error"], // Only warnings and errors
  silent: process.env.NODE_ENV === 'test' // Silent during tests
});

// Express.js middleware example
app.use((req, res, next) => {
  ssrLogger.info("Request", {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});
```

### Example Output (Server):
```
[2024-01-15T10:30:00.000Z] [INFO] Server started {"port":3000,"env":"production"}
[2024-01-15T10:30:01.123Z] [ERROR] Database connection failed {"host":"localhost","error":"ECONNREFUSED"}
[2024-01-15T10:30:02.456Z] [WARN] High memory usage {"usage":0.85,"threshold":0.8}
```

### SSR Configuration Details:

```typescript
const ssrDefaults = {
  enableEmojis: false,      // Clean for server logs
  enableColors: false,      // Conditional based on environment
  enableTimestamp: true,    // Important for server logs
  includeRequestId: true,   // For request correlation
  includeContext: true,     // For debugging context
  enableStructuredOutput: false
};
```

## CSR (Client-Side Rendering) Configuration

**Optimized for browser environments with visual appeal and interactive debugging.**

### Features:
- ✅ **Rich emojis** - Visual appeal and quick recognition in browser console
- 🌈 **Full colors** - Enhanced readability in browser dev tools
- 🎨 **Syntax highlighting** - Beautiful object formatting for debugging
- � **No timestamps** - Browser console already shows timing information
- 🎯 **Reduced clutter** - No request IDs or excessive context for cleaner output
- 🔍 **Interactive debugging** - Optimized for browser dev tools

### Usage:

```typescript
import { createCSRLogger, csrLogger } from '@ru-dr/plip';

// Use pre-configured instance
csrLogger.success("User authenticated", { userId: 123, role: "admin" });
csrLogger.debug("Component state", { user: userData, isLoading: false });

// React component example
function UserProfile({ userId }) {
  useEffect(() => {
    csrLogger.info("UserProfile mounted", { userId });
    
    return () => {
      csrLogger.debug("UserProfile unmounted", { userId });
    };
  }, [userId]);

  const handleLogin = async () => {
    csrLogger.time('login-process');
    try {
      const result = await authService.login();
      csrLogger.success("Login successful", result);
    } catch (error) {
      csrLogger.error("Login failed", error);
    } finally {
      csrLogger.timeEnd('login-process');
    }
  };
}

// Create custom CSR logger with overrides
const customClientLogger = createCSRLogger({
  enabledLevels: ["info", "warn", "error"], // Reduced verbosity
  enableEmojis: false // Disable emojis if preferred
});

// React component example
const LoginForm = () => {
  const handleSubmit = async (userData) => {
    csrLogger.info("Login attempt", { email: userData.email });
    
    try {
      const response = await login(userData);
      csrLogger.success("Login successful", { userId: response.userId });
    } catch (error) {
      csrLogger.error("Login failed", { error: error.message });
    }
  };
};
```

### Example Output:
```
🎉 [SUCCESS] User authenticated {"userId":123,"timestamp":"2025-06-01T10:30:00.000Z"}
🔍 [DEBUG] Component state {"user":{"name":"John"},"isLoading":false}
💥 [ERROR] Login failed {"error":"Invalid credentials"}
```

## Environment-Based Log Levels

Both SSR and CSR configurations automatically adjust log levels based on your environment:

### SSR Log Levels:
- **Production**: `[]` (empty) - No logs by default, user must explicitly enable
- **Development**: `["info", "warn", "error", "success", "debug", "trace", "verbose"]` - All levels for comprehensive debugging

### CSR Log Levels:
- **Production**: `[]` (empty) - No logs by default, user must explicitly enable
- **Development**: `["verbose", "debug", "info", "success", "warn", "error", "trace"]` - Full debugging with different ordering

## Configuration Overrides

Both SSR and CSR loggers accept configuration overrides:

```typescript
// Custom SSR logger with specific settings
const apiLogger = createSSRLogger({
  enabledLevels: ["info", "warn", "error"],
  devOnly: false // Always log, even in production
});

// Custom CSR logger with specific settings  
const debugLogger = createCSRLogger({
  enableColors: false, // Disable colors
  enabledLevels: ["debug", "trace", "verbose"] // Only debug messages
});
```

### Example Output (Browser):
```
🎉 [SUCCESS] User authenticated {"userId":123,"role":"admin"}
🔍 [DEBUG] Component state {"user":{"name":"John"},"isLoading":false}
⏱️ [TIMER] login-process: 342ms
```

### CSR Configuration Details:

```typescript
const csrDefaults = {
  enableEmojis: true,       // Rich visual experience
  enableColors: true,       // Colorful browser console
  enableTimestamp: false,   // Browser already shows time
  includeRequestId: false,  // Not needed in client
  includeContext: false,    // Less clutter
  enableSyntaxHighlighting: true
};
```

## Configuration Comparison

| Feature | SSR (Server) | CSR (Client) | Purpose |
|---------|--------------|--------------|---------|
| **Emojis** | ❌ Disabled | ✅ Enabled | Server logs vs visual appeal |
| **Colors** | 🔄 Conditional | ✅ Enabled | Terminal detection vs browser |
| **Timestamps** | ✅ Enabled | ❌ Disabled | Chronological server logs vs browser timing |
| **Request IDs** | ✅ Enabled | ❌ Disabled | Distributed tracing vs simplicity |
| **Context** | ✅ Enabled | ❌ Disabled | Server debugging vs clean output |
| **Syntax Highlighting** | ✅ Enabled | ✅ Enabled | Object formatting for both |

## Auto-Detection

Plip can automatically detect your environment and apply the appropriate configuration:

```typescript
import { getAutoConfig } from '@ru-dr/plip';

// Automatically chooses SSR or CSR config based on environment
const autoConfig = getAutoConfig();
const logger = createPlip(autoConfig);

// Detection logic:
// - Browser environment → CSR config
// - Node.js with DOM globals → CSR config  
// - Pure Node.js → SSR config (rarely used, usually explicit)
```

## Framework Integration Examples

### Next.js (Full-Stack)

```typescript
// pages/api/users.ts (Server-side)
import { ssrLogger } from '@ru-dr/plip';

export default function handler(req, res) {
  ssrLogger.info("API route called", { 
    method: req.method, 
    url: req.url 
  });
  
  try {
    const users = await getUsers();
    ssrLogger.success("Users retrieved", { count: users.length });
    res.json(users);
  } catch (error) {
    ssrLogger.error("Failed to get users", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// components/UserList.tsx (Client-side)
import { csrLogger } from '@ru-dr/plip';

export function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    csrLogger.info("UserList component mounted");
    
    fetchUsers()
      .then(data => {
        csrLogger.success("Users loaded", { count: data.length });
        setUsers(data);
      })
      .catch(error => {
        csrLogger.error("Failed to load users", error);
      });
  }, []);

  return <div>{/* component JSX */}</div>;
}
// lib/logger.ts
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// Server-side logger for API routes and SSR
export const serverLogger = createSSRLogger();

// Client-side logger for browser components
export const clientLogger = createCSRLogger();
```

```typescript
// pages/api/users.ts (SSR)
import { serverLogger } from '../../lib/logger';

export default function handler(req, res) {
  serverLogger.info("API request", { method: req.method, url: req.url });
  // ... handle request
}
```

```typescript
// components/UserProfile.tsx (CSR)
'use client';
import { clientLogger } from '../lib/logger';

export function UserProfile() {
  useEffect(() => {
    clientLogger.debug("UserProfile mounted", { userId });
  }, []);
  // ... component logic
}
```

### Express.js with SSR

```typescript
import express from 'express';
import { ssrLogger } from '@ru-dr/plip';

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  ssrLogger.info("Request", {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// Error handling
app.use((err, req, res, next) => {
  ssrLogger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    url: req.url
  });
  res.status(500).json({ error: 'Internal server error' });
});
```

## Migration Guide

If you're currently using the default `plip` logger, you can gradually migrate:

```typescript
// Before (still works, but automatically chooses config)
import { plip } from '@ru-dr/plip';
plip.info("Message");

// After (explicit SSR/CSR choice)
import { ssrLogger, csrLogger } from '@ru-dr/plip';

// In server-side code
ssrLogger.info("Server message");

// In client-side code  
csrLogger.info("Client message");
```

## Best Practices

### ✅ Do:
- Use SSR loggers for server-side code (APIs, middleware, background jobs)
- Use CSR loggers for client-side code (React components, browser interactions)
- Override configurations to match your specific needs
- Use structured logging with meaningful data objects
- Respect different log levels for different environments

### ❌ Don't:
- Mix SSR and CSR loggers in the same context without purpose
- Log sensitive information (passwords, tokens) in any configuration
- Use verbose logging levels in production environments
- Ignore the performance impact of extensive logging

## Advanced Usage

### Custom Environment Detection

```typescript
import { createSSRLogger, createCSRLogger, getAutoConfig } from '@ru-dr/plip';

// Custom logic for choosing configuration
const logger = isMicroservice() 
  ? createSSRLogger({ enabledLevels: ["warn", "error"] })
  : isElectronApp()
  ? createCSRLogger({ enableColors: false })
  : createPlip(getAutoConfig());
```

### Dynamic Configuration Switching

```typescript
class AdaptiveLogger {
  private ssrLogger = createSSRLogger();
  private csrLogger = createCSRLogger();
  
  get current() {
    return typeof window !== 'undefined' 
      ? this.csrLogger 
      : this.ssrLogger;
  }
  
  info = (...args) => this.current.info(...args);
  error = (...args) => this.current.error(...args);
  // ... other methods
}

export const adaptiveLogger = new AdaptiveLogger();
```
