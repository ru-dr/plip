<div align="center">

# Plip Logger

*A delightful, colorful logging experience for modern applications*

[![npm version](https://badgen.net/npm/v/@ru-dr/plip)](https://www.npmjs.com/package/@ru-dr/plip)
[![License: MIT](https://badgen.net/badge/license/MIT/yellow)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badgen.net/badge/TypeScript/Ready/blue)](https://www.typescriptlang.org/)

[Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#api-documentation) • [Examples](#examples) • [Contributing](#contributing)

</div>

---

## Why Plip?

Tired of boring console logs? **Plip** brings joy back to logging with:

- **Smart Colors** - Automatic terminal detection with beautiful color schemes
- **7 Log Levels** - From `verbose` to `error`, perfect granularity
- **Syntax Highlighting** - JSON objects rendered beautifully
- **Fluent API** - Chain methods for elegant configuration
- **Zero Config** - Works great out of the box, CSR by default
- **SSR/CSR Optimized** - Specialized configs for server and client environments
- **TypeScript First** - Full type safety and IntelliSense
- **Environment Aware** - Respects `NODE_ENV` and terminal capabilities
- **Zero Dependencies** - No runtime dependencies, tree-shakeable (`"sideEffects": false`)
- **Dual ESM + CommonJS** - `import` and `require` both work

## Installation

```sh
# npm
npm install @ru-dr/plip

# yarn
yarn add @ru-dr/plip

# pnpm
pnpm add @ru-dr/plip

# bun
bun add @ru-dr/plip
```

> Plip is a **JavaScript/TypeScript** library with zero runtime dependencies. It ships both ESM (`dist/esm/index.js`) and CommonJS (`dist/cjs/index.js`) builds, with types at `dist/esm/index.d.ts`, and requires Node.js 16 or newer.

## Quick Start

Get logging in seconds:

```typescript
import { plip } from '@ru-dr/plip';

plip.info("Welcome to Plip!");
plip.success("Everything is working perfectly");
plip.warn("This might need your attention");
plip.error("Something went wrong");

// Log complex objects with beautiful syntax highlighting
plip.info("User profile:", {
  name: "Alex Developer",
  age: 28,
  skills: ["TypeScript", "Node.js", "React"],
  active: true
});
```

**Output Preview:**
```
[INFO] Welcome to Plip!
[SUCCESS] Everything is working perfectly
[WARN] This might need your attention
[ERROR] Something went wrong
[INFO] User profile: {
  "name": "Alex Developer",
  "age": 28,
  "skills": ["TypeScript", "Node.js", "React"],
  "active": true
}
```

## API Documentation

### Creating Logger Instances

```typescript
import { plip, createPlip } from '@ru-dr/plip';

// Use the default logger (recommended for most cases)
plip.info("Using default logger");

// Create a custom logger with specific configuration
const customLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});

// Create a production logger
const prodLogger = createPlip({
  enableColors: false,
  enabledLevels: ['warn', 'error']
});
```

### Log Levels

Plip provides 7 distinct log levels, each with its own color:

| Level | Description | Use Case |
|-------|-------------|----------|
| `info` | General information | App status, user actions |
| `success` | Success messages | Completed operations |
| `warn` | Warning messages | Deprecated features, recoverable errors |
| `error` | Error messages | Exceptions, failures |
| `debug` | Debug information | Development debugging |
| `trace` | Detailed tracing | Performance monitoring |
| `verbose` | Verbose output | Detailed system information |

```typescript
// Using all log levels
plip.info("Application started successfully");
plip.success("User authenticated");
plip.warn("API rate limit approaching");
plip.error("Database connection failed");
plip.debug("Processing user request", { userId: 123 });
plip.trace("Function execution time: 45ms");
plip.verbose("System memory usage:", process.memoryUsage());
```

### Configuration Options

Customize Plip to fit your needs:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `silent` | `boolean` | `false` | Suppress all output |
| `enableColors` | `boolean` | `auto-detect` | Use colorized output |
| `enableSyntaxHighlighting` | `boolean` | `true` | Highlight object syntax |
| `devOnly` | `boolean` | `auto-detect` | Only log in development |
| `enabledLevels` | `LogLevel[]` | `all` | Array of levels to enable |
| `minLevel` | `LogLevel` | `undefined` | Severity threshold - levels ranked below it are dropped |
| `onError` | `LogErrorHandler` | `console.error` | Called when a transport throws or rejects |
| `theme` | `Partial<PlipTheme>` | `default` | Custom colors |

```typescript
const logger = createPlip({
  silent: false,
  enableColors: true,
  enableSyntaxHighlighting: true,
  devOnly: false,
  enabledLevels: ['info', 'warn', 'error', 'success'],
  theme: {
    colors: {
      info: customBlueColor,
      success: customGreenColor
    }
  }
});
```

### Fluent API (Method Chaining)

Build your perfect logger with our fluent, chainable API:

```typescript
const logger = plip
  .withColors(true)           // Enable colors
  .withSyntaxHighlighting(true) // Enable JSON highlighting
  .levels('info', 'error', 'success') // Only these levels
  .silent();                  // Make it silent

// Each method returns a new logger instance
const devLogger = plip.levels('debug', 'trace', 'verbose');
const prodLogger = plip.levels('warn', 'error').withColors(false);
```

**Available Fluent Methods:**
- `.withColors(enabled)` - Toggle color output
- `.withSyntaxHighlighting(enabled)` - Toggle object highlighting
- `.withContext(context)` - Add persistent context to all logs
- `.child(context)` - Create a child logger with additional context
- `.levels(...levels)` - Filter enabled log levels
- `.minLevel(level)` - Set a severity threshold
- `.silent()` - Suppress all output

`logger.flush()` returns a promise that resolves once every attached transport has drained - useful before a process exits.

## Examples

### Basic Logging
```typescript
import { plip } from '@ru-dr/plip';

// Simple messages
plip.info("Server starting on port 3000");
plip.success("Database connected successfully");

// With data
plip.info("New user registered:", { email: "user@example.com", id: 123 });
plip.error("Authentication failed:", { reason: "invalid_token", userId: 456 });
```

### Context-Aware Logging
```typescript
import { plip } from '@ru-dr/plip';

// Create context-aware loggers for different scopes
const authLogger = plip.withContext({ scope: "auth" });
const dbLogger = plip.withContext({ scope: "database", pool: "primary" });
const apiLogger = plip.withContext({ scope: "api", version: "v1" });

// All logs will include the context automatically
authLogger.info("User login attempt", { userId: 123, method: "oauth" });
// Output: [INFO] User login attempt {"scope":"auth","userId":123,"method":"oauth"}

dbLogger.warn("Connection pool high usage", { activeConnections: 45 });
// Output: [WARN] Connection pool high usage {"scope":"database","pool":"primary","activeConnections":45}

// Context can be chained and extended
const requestLogger = apiLogger.withContext({ requestId: "req-789" });
requestLogger.error("Request processing failed", { endpoint: "/users" });
// Output: [ERROR] Request processing failed {"scope":"api","version":"v1","requestId":"req-789","endpoint":"/users"}
```

### Environment-Specific Logging
```typescript
import { createPlip } from '@ru-dr/plip';

// Development logger - verbose and colorful
const devLogger = createPlip({
  enabledLevels: ['debug', 'trace', 'info', 'warn', 'error'],
  enableColors: true
});

// Production logger - errors and warnings only
const prodLogger = createPlip({
  enabledLevels: ['warn', 'error'],
  enableColors: false,
  enableSyntaxHighlighting: false
});

// Use based on environment
const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
```

### Custom Themes
```typescript
import { createPlip, colors } from '@ru-dr/plip';

const logger = createPlip({
  theme: {
    colors: {
      info: colors.blue,
      success: colors.green,
      warn: colors.yellow,
      error: colors.red
    }
  }
});
```

### Conditional Logging
```typescript
import { createPlip } from '@ru-dr/plip';

// Only log in development
const debugLogger = createPlip({
  devOnly: true,
  enabledLevels: ['debug', 'trace']
});

// Log everything except in production
const logger = createPlip({
  enabledLevels: process.env.NODE_ENV === 'production' 
    ? ['warn', 'error'] 
    : ['debug', 'info', 'warn', 'error']
});
```

## SSR vs CSR Logging

Plip provides **optimized configurations** for both Server-Side Rendering (SSR) and Client-Side Rendering (CSR) environments. **CSR is the default** for the best modern web development experience.

### Quick Usage

```typescript
import { plip, createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// Default logger uses CSR configuration (with colors)
plip.info("Hello world!"); // [INFO] Hello world!

// Explicit SSR logger (optimized for servers)
const serverLogger = createSSRLogger();
serverLogger.info("Server started", { port: 3000 }); 
// Output: 2025-01-01T00:00:00.000Z [INFO] Server started {"port":3000}
// (SSR enables timestamps by default)

// Explicit CSR logger (optimized for browsers) 
const clientLogger = createCSRLogger();
clientLogger.success("User logged in", { userId: 123 });
// Output: [SUCCESS] User logged in {"userId":123}
```

### Key Differences

| Feature | SSR (Server) | CSR (Client) |
|---------|-------------|-------------|
| **Colors** | Enabled in development, disabled in production | Enabled |
| **Syntax Highlighting** | Enabled | Enabled |
| **Timestamps** | Enabled | Disabled |
| **Structured (JSON) Output** | Enabled in production | Disabled |
| **Best For** | APIs, servers, logs | Browsers, debugging |
| **Output Style** | Structured, plain | Rich, visual |

### Framework Examples

```typescript
// Next.js API Route (SSR)
import { createSSRLogger } from '@ru-dr/plip';
const serverLogger = createSSRLogger();

export default function handler(req, res) {
  serverLogger.info("API request", { method: req.method, url: req.url });
}

// React Component (CSR)  
import { createCSRLogger } from '@ru-dr/plip';
const clientLogger = createCSRLogger();

function App() {
  useEffect(() => {
    clientLogger.success("App loaded"); // [SUCCESS] App loaded
  }, []);
}
```

> **Learn More:** Check out our [SSR vs CSR Guide](./docs/guide/ssr-csr.md) for detailed examples and best practices.
```typescript
import { createPlip } from '@ru-dr/plip';

// Only log in development
const debugLogger = createPlip({ devOnly: true });

// Custom conditions
const logger = createPlip({
  enabledLevels: process.env.DEBUG ? 
    ['debug', 'trace', 'info', 'warn', 'error'] : 
    ['warn', 'error']
});
```

## Advanced Usage

### TypeScript Integration
```typescript
import { PlipConfig, LogLevel, createPlip, colors } from '@ru-dr/plip';

// Type-safe configuration
const config: PlipConfig = {
  enabledLevels: ['info', 'error'] as LogLevel[],
  enableColors: true,
  theme: {
    colors: {
      info: colors.blue,
      error: colors.red
    }
  }
};

const logger = createPlip(config);
```

### Framework Integration

#### Express.js Middleware
```typescript
import express from 'express';
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();
const app = express();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});
```

#### Error Handling
```typescript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

try {
  // Your application logic
} catch (error) {
  logger.error('Application error:', error);
}
```

## Learn More

Explore our comprehensive documentation to master Plip Logger:

### **Guides**
- [Basic Usage](./docs/guide/basic-usage.md) - Learn the fundamentals
- [Configuration](./docs/guide/configuration.md) - Customize Plip to your needs  
- [SSR vs CSR](./docs/guide/ssr-csr.md) - Server-side and client-side optimized configurations
- [Best Practices](./docs/guide/best-practices.md) - Write better logs

### **Examples & Patterns**
- [Custom Loggers](./docs/examples/custom-loggers.md) - **Context-aware logging** and advanced patterns
- [Integration Examples](./docs/examples/integration.md) - Framework-specific implementations
- [Production Setup](./docs/examples/production.md) - Production-ready configurations
- [SSR/CSR Quick Start](./docs/examples/ssr-csr-quickstart.md) - Get started with server/client logging

### **Integrations**
- [Express.js](./docs/integration/express.md) - Express middleware and patterns
- [Next.js](./docs/integration/nextjs.md) - Next.js SSR/CSR integration
- [NestJS](./docs/integration/nestjs.md) - NestJS dependency injection
- [Database Logging](./docs/integration/database.md) - Database query logging

### **API Reference**
- [Logger API](./docs/api/logger.md) - Complete method reference
- [Configuration](./docs/api/configuration.md) - All configuration options
- [Types](./docs/api/types.md) - TypeScript definitions

> **Pro Tip:** Start with [Custom Loggers](./docs/examples/custom-loggers.md) to learn context-aware logging with `plip.withContext({ scope: "auth" })`

## Contributing

We love contributions! Here's how you can help make Plip even better:

### Found a Bug?
- Check if it's already reported in [Issues](https://github.com/ru-dr/plip/issues)
- If not, [create a new issue](https://github.com/ru-dr/plip/issues/new) with:
  - Clear description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Your environment details

### Have an Idea?
- [Open a feature request](https://github.com/ru-dr/plip/issues/new)
- Join our discussions
- Check our [roadmap](https://github.com/ru-dr/plip/projects) for planned features

### Want to Code?
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/plip.git`
3. **Create** a branch: `git checkout -b feature/amazing-feature`
4. **Install** dependencies: `bun install`
5. **Make** your changes
6. **Test** your changes: `bun test`
7. **Build** the project: `bun run build`
8. **Commit** your changes: `git commit -m 'Add amazing feature'`
9. **Push** to your branch: `git push origin feature/amazing-feature`
10. **Open** a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/ru-dr/plip.git
cd plip

# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Build the project
bun run build

# Test your changes
bun run dev
```

### Testing
We use [Bun](https://bun.sh/) for testing. Please ensure:
- All tests pass: `bun test`
- Add tests for new features
- Maintain or improve code coverage
- Follow existing test patterns

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR:** You can use, modify, and distribute this project freely. Just keep the copyright notice!

---

<div align="center">

**Made with love by [ru-dr](https://github.com/ru-dr)**

**Star this repo if you find it useful!**

[Report Bug](https://github.com/ru-dr/plip/issues) • [Request Feature](https://github.com/ru-dr/plip/issues) • [Discussions](https://github.com/ru-dr/plip/discussions)

</div>
