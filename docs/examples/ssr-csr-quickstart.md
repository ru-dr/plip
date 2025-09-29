# Quick Start Examples: SSR vs CSR Logging

## Basic Usage

```typescript
import { plip, createSSRLogger, createCSRLogger, ssrLogger, csrLogger } from '@ru-dr/plip';

// Default logger (CSR optimized)
plip.info("Hello world!"); // 🫧 [INFO] Hello world!

// Pre-configured SSR logger (clean server logs)
ssrLogger.info("Server started", { port: 3000 }); 
// Output: [2024-01-15T10:30:00.000Z] [INFO] Server started {"port":3000}

// Pre-configured CSR logger (rich browser experience)
csrLogger.success("User logged in", { userId: 123 }); 
// Output: ✅ [SUCCESS] User logged in {"userId":123}

// Custom loggers with overrides
const customServerLogger = createSSRLogger({
  enabledLevels: ['info', 'warn', 'error']
});

const customClientLogger = createCSRLogger({
  enableSyntaxHighlighting: true
});
```

## Framework Examples

### Next.js

```typescript
// lib/loggers.ts
import { ssrLogger, csrLogger } from '@ru-dr/plip';

// Use pre-configured loggers
export { ssrLogger as serverLogger, csrLogger as clientLogger };

// Or create custom loggers
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

export const customServerLogger = createSSRLogger({
  enabledLevels: ['info', 'warn', 'error'],
  includeRequestId: true,
  enableTimestamp: true
});

export const customClientLogger = createCSRLogger({
  enableSyntaxHighlighting: true,
  enableColors: true
});
```

```typescript
// pages/api/users.ts (Server-side)
import { serverLogger } from '../../lib/loggers';

export default function handler(req, res) {
  serverLogger.info("API request", { method: req.method, url: req.url });
  // Clean server output: [2024-01-15T10:30:00.000Z] [INFO] API request {"method":"GET","url":"/api/users"}
  
  try {
    const users = await getUsers();
    serverLogger.success("Users retrieved", { count: users.length });
    res.json(users);
  } catch (error) {
    serverLogger.error("Database error", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

```typescript
// components/UserForm.tsx (Client-side)
'use client';
import { clientLogger } from '../lib/loggers';

export function UserForm() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    clientLogger.info("UserForm component mounted");
    // Rich browser output: 🫧 [INFO] UserForm component mounted
  }, []);

  const handleSubmit = async (data) => {
    clientLogger.time('form-submission');
    
    try {
      const result = await submitForm(data);
      clientLogger.success("Form submitted successfully", result);
      // Output: ✅ [SUCCESS] Form submitted successfully {"id":"user-123"}
    } catch (error) {
      clientLogger.error("Form submission failed", error);
      // Output: 💥 [ERROR] Form submission failed Error: Validation failed
    } finally {
      clientLogger.timeEnd('form-submission');
      // Output: ⏱️ [TIMER] form-submission: 245ms
    }
  };
  const handleSubmit = async (data) => {
    clientLogger.info("Form submission started"); // 🫧 [INFO] with colors
    try {
      await submitForm(data);
      clientLogger.success("Form submitted successfully"); // 🎉 [SUCCESS]
    } catch (error) {
      clientLogger.error("Form submission failed", { error }); // 💥 [ERROR]
    }
  };
}
```

### Express.js

```typescript
import express from 'express';
import { createSSRLogger } from '@ru-dr/plip';

const app = express();
const logger = createSSRLogger(); // Perfect for server logging

// Request logging middleware
app.use((req, res, next) => {
  logger.info("Request", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

// Error handling
app.use((err, req, res, next) => {
  logger.error("Server error", {
    error: err.message,
    stack: err.stack,
    url: req.url
  });
  res.status(500).json({ error: 'Internal server error' });
});
```

### React Application

```typescript
// utils/logger.ts
import { createCSRLogger } from '@ru-dr/plip';

export const logger = createCSRLogger(); // Great for browser debugging

// App.tsx
import { logger } from './utils/logger';

function App() {
  useEffect(() => {
    logger.info("App initialized"); // 🫧 [INFO] App initialized
  }, []);

  const handleError = (error) => {
    logger.error("Application error", { 
      error: error.message,
      component: 'App',
      timestamp: new Date()
    }); // 💥 [ERROR] with rich formatting
  };

  return <div>...</div>;
}
```

## Environment-Specific Configurations

### Development vs Production

```typescript
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// Server logger with environment-aware settings
const serverLogger = createSSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production' 
    ? ['warn', 'error'] 
    : ['debug', 'info', 'warn', 'error']
});

// Client logger with environment-aware settings
const clientLogger = createCSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'warn', 'error']
    : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});
```

### Custom Overrides

```typescript
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// Minimal SSR logger for high-traffic APIs
const apiLogger = createSSRLogger({
  enabledLevels: ['error'], // Only errors
  silent: process.env.NODE_ENV === 'test' // Silent during tests
});

// Custom CSR logger for specific features
const debugLogger = createCSRLogger({
  enableEmojis: false, // Cleaner console output
  enabledLevels: ['debug', 'trace'] // Only debug messages
});
```

## Migration from Default Logger

```typescript
// Before: Using default logger everywhere
import { plip } from '@ru-dr/plip';

plip.info("This works everywhere but isn't optimized");

// After: Using specific loggers for specific contexts
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// In server-side code (APIs, middleware, background jobs)
const serverLogger = createSSRLogger();
serverLogger.info("Server message"); // Optimized for servers

// In client-side code (React components, browser scripts)
const clientLogger = createCSRLogger();  
clientLogger.info("Client message"); // Optimized for browsers

// Default plip still works and uses CSR by default
plip.info("Still works, uses CSR configuration");
```

## Best Practices Summary

1. **Use SSR loggers for:**
   - API routes and server endpoints
   - Express.js/Fastify middleware
   - Database operations
   - Background jobs and workers
   - Production environments

2. **Use CSR loggers for:**
   - React/Vue/Angular components
   - Browser-side JavaScript
   - Development and debugging
   - User interaction logging

3. **Default `plip` instance:**
   - Uses CSR configuration by default
   - Good for general purpose and getting started
   - Can be used anywhere but isn't environment-optimized
