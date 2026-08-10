# Framework-Specific SSR/CSR Guide

This guide provides specific recommendations for implementing Plip Logger in different frameworks, with clear guidance on when to use **SSR (Server-Side Rendering)** vs **CSR (Client-Side Rendering)** configurations.

## Framework Classification

### Server-Side Frameworks (Use SSR Logger)
- **Express.js** - Pure server-side framework
- **Fastify** - High-performance server framework  
- **NestJS** - Enterprise server framework
- **Koa.js** - Minimalist server framework
- **Hapi.js** - Configuration-centric server framework

### Client-Side Frameworks (Use CSR Logger)
- **React** - Browser component library
- **Vue.js** - Progressive browser framework
- **Angular** - Full-featured browser framework
- **Svelte** - Compile-time browser framework
- **Preact** - Lightweight React alternative

### Full-Stack Frameworks (Use Both)
- **Next.js** - React with SSR/SSG capabilities
- **Nuxt.js** - Vue with SSR/SSG capabilities  
- **SvelteKit** - Svelte with SSR capabilities
- **Remix** - React with server-side focus
- **Astro** - Multi-framework with SSG/SSR

## Framework-Specific Implementation

### Next.js (Full-Stack)

Next.js requires different loggers for different contexts:

```typescript
// lib/loggers.ts
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// Server-side: API routes, middleware, getServerSideProps
export const serverLogger = createSSRLogger();

// Client-side: React components, browser events
export const clientLogger = createCSRLogger();
```

**Usage Examples:**

```typescript
// pages/api/users.ts (Server-side)
import { serverLogger } from '../../lib/loggers';

export default function handler(req, res) {
  serverLogger.info("API request", { method: req.method, url: req.url });
}

// components/UserForm.tsx (Client-side)
'use client';
import { clientLogger } from '../lib/loggers';

export function UserForm() {
  const handleSubmit = () => {
    clientLogger.info("Form submitted");
  };
}

// pages/users.tsx (SSR)
export async function getServerSideProps() {
  serverLogger.info("Fetching users for SSR");
  // Server-side data fetching
}
```

### Express.js (Server-Side Only)

Express.js runs entirely on the server, so use **SSR logger** throughout:

```typescript
import express from 'express';
import { createSSRLogger } from '@ru-dr/plip';

const app = express();
const logger = createSSRLogger();

// Middleware
app.use((req, res, next) => {
  logger.info("Request", { method: req.method, url: req.url });
  next();
});

// Routes
app.get('/api/users', (req, res) => {
  logger.debug("Fetching users");
  // Handle request
});

// Error handling
app.use((err, req, res, next) => {
  logger.error("Server error", { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});
```

### React (Client-Side Only)

React runs in the browser, so use **CSR logger** throughout:

```typescript
import { createCSRLogger } from '@ru-dr/plip';

const logger = createCSRLogger();

function App() {
  useEffect(() => {
    logger.info("App initialized");
  }, []);

  const handleUserAction = (action) => {
    logger.debug("User action", { action, timestamp: new Date() });
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### NestJS (Server-Side with DI)

NestJS is server-side, so use **SSR logger** with dependency injection:

```typescript
// logger.service.ts
import { Injectable } from '@nestjs/common';
import { createSSRLogger } from '@ru-dr/plip';

@Injectable()
export class LoggerService {
  private logger = createSSRLogger();

  info(message: string, data?: any) {
    this.logger.info(message, data);
  }

  error(message: string, data?: any) {
    this.logger.error(message, data);
  }
}

// users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private logger: LoggerService) {}

  @Get()
  async getUsers() {
    this.logger.info("Fetching users");
    // Handle request
  }
}
```

### Nuxt.js (Full-Stack Vue)

Nuxt.js has both server and client contexts:

```typescript
// plugins/logger.client.ts
import { createCSRLogger } from '@ru-dr/plip';

export const clientLogger = createCSRLogger();

// plugins/logger.server.ts  
import { createSSRLogger } from '@ru-dr/plip';

export const serverLogger = createSSRLogger();

// pages/users.vue
<script setup>
import { clientLogger } from '~/plugins/logger.client';
import { serverLogger } from '~/plugins/logger.server';

// Server-side (during SSR)
const { data: users } = await useFetch('/api/users', {
  onRequest() {
    if (process.server) {
      serverLogger.info("SSR: Fetching users");
    }
  }
});

// Client-side (in browser)
onMounted(() => {
  clientLogger.info("Users page mounted", { userCount: users.value.length });
});
</script>
```

### SvelteKit (Full-Stack Svelte)

SvelteKit supports both server and client-side logging:

```typescript
// lib/loggers.ts
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

export const serverLogger = createSSRLogger();
export const clientLogger = createCSRLogger();

// src/routes/users/+page.server.ts (Server-side)
import { serverLogger } from '$lib/loggers';

export async function load() {
  serverLogger.info("Loading users page (SSR)");
  // Server-side data loading
}

// src/routes/users/+page.svelte (Client-side)
<script>
  import { clientLogger } from '$lib/loggers';
  import { onMount } from 'svelte';

  onMount(() => {
    clientLogger.info("Users page mounted");
  });
</script>
```

## Environment Detection Patterns

### Automatic Context Detection

```typescript
// utils/logger.ts
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

export const logger = typeof window !== 'undefined' 
  ? createCSRLogger()  // Browser environment
  : createSSRLogger(); // Server environment
```

### Framework-Specific Detection

```typescript
// Next.js specific
export const getLogger = () => {
  if (typeof window !== 'undefined') {
    return createCSRLogger(); // Client-side
  }
  return createSSRLogger(); // Server-side
};

// Universal with feature detection
export const createUniversalLogger = () => {
  const isNode = typeof process !== 'undefined' && process.versions?.node;
  const isBrowser = typeof window !== 'undefined';
  
  if (isNode && !isBrowser) {
    return createSSRLogger(); // Pure Node.js
  }
  return createCSRLogger(); // Browser or mixed environment
};
```

## Best Practices by Framework Type

### Server-Side Frameworks
**Do:**
- Use `createSSRLogger()` for all logging
- Log request/response cycles with correlation IDs
- Include performance metrics (response time, memory usage)
- Use structured logging with consistent field names
- Implement proper error handling and stack traces

**Don't:**
- Use client-side logger configurations
- Log sensitive information (passwords, tokens)
- Create excessive log entries in high-traffic endpoints

### Client-Side Frameworks  
**Do:**
- Use `createCSRLogger()` for all browser logging
- Log user interactions and component lifecycle events
- Include user context (user ID, session ID) when available
- Log client-side errors with component stack traces
- Use appropriate log levels for debugging vs production

**Don't:**
- Use server-side logger configurations
- Log personal user data without proper consent
- Create excessive logs that impact browser performance

### Full-Stack Frameworks
**Do:**
- Use separate loggers for server and client contexts
- Maintain consistent log formatting across both sides
- Use correlation IDs to track requests across server/client
- Implement proper environment detection
- Document which logger to use in different parts of your app

**Don't:**
- Mix SSR and CSR loggers in the same context
- Assume the environment without proper detection
- Ignore the performance implications of excessive logging

## Migration Guide

### From Generic Logger to Framework-Specific

```typescript
// Before: Generic approach
import { plip } from '@ru-dr/plip';
plip.info("Message"); // Works but not optimized

// After: Framework-specific approach

// Server-side code (Express, NestJS, API routes)
import { createSSRLogger } from '@ru-dr/plip';
const logger = createSSRLogger();
logger.info("Server message"); // Optimized for servers

// Client-side code (React, Vue, browser scripts)
import { createCSRLogger } from '@ru-dr/plip';
const logger = createCSRLogger();  
logger.info("Client message"); // Optimized for browsers
```

### Framework Migration Examples

```typescript
// Express.js migration
// Before
import { plip } from '@ru-dr/plip';
app.use((req, res, next) => {
  plip.info("Request");
  next();
});

// After  
import { createSSRLogger } from '@ru-dr/plip';
const logger = createSSRLogger();
app.use((req, res, next) => {
  logger.info("Request", { method: req.method, url: req.url });
  next();
});

// React migration
// Before
import { plip } from '@ru-dr/plip';
function Component() {
  useEffect(() => {
    plip.info("Component mounted");
  }, []);
}

// After
import { createCSRLogger } from '@ru-dr/plip';
const logger = createCSRLogger();
function Component() {
  useEffect(() => {
    logger.info("Component mounted", { componentName: 'Component' });
  }, []);
}
```

This framework-specific approach ensures optimal logging performance and output formatting for each environment.
