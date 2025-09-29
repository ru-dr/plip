# Transports API

Complete API reference for Plip transport classes and configurations.

## Overview

Transports control where and how log messages are delivered. Plip includes several built-in transports:

- **ConsoleTransport**: Logs to the console (default)
- **FileTransport**: Logs to files with optional rotation
- **RemoteTransport**: Sends logs to remote servers with batching
- **BrowserTransport**: Browser-specific logging with localStorage support

## BaseTransport

All transports extend from `BaseTransport` and implement the `Transport` interface.

```typescript
interface Transport {
  name: string;
  log(entry: FormattedLogEntry): void | Promise<void>;
  shouldLog?(level: LogLevel): boolean;
  configure?(config: any): void;
  close?(): void | Promise<void>;
}
```

## TransportConfig

Base configuration interface for all transports.

```typescript
interface TransportConfig {
  name: string;           // Unique transport identifier
  level?: LogLevel[];     // Log levels to handle (default: all)
  silent?: boolean;       // Disable this transport (default: false)
}
```

## ConsoleTransport

Logs messages to the console with optional color and emoji support.

```typescript
import { ConsoleTransport } from '@ru-dr/plip';

const consoleTransport = new ConsoleTransport({
  name: 'console',
  level: ['info', 'warn', 'error'],
  useColors: true,
  useEmojis: true,
  useSyntaxHighlighting: true
});
```

### ConsoleTransportConfig

```typescript
interface ConsoleTransportConfig extends TransportConfig {
  useColors?: boolean;           // Enable ANSI colors (default: auto-detect)
  useEmojis?: boolean;           // Enable emoji prefixes (default: true)
  useSyntaxHighlighting?: boolean; // Enable object highlighting (default: true)
}
```

## FileTransport

Writes log messages to files with optional rotation and formatting.

```typescript
import { FileTransport } from '@ru-dr/plip';

const fileTransport = new FileTransport({
  name: 'file',
  filename: '/var/log/app.log',
  level: ['warn', 'error'],
  format: 'json',
  maxSize: 10485760, // 10MB
  maxFiles: 5
});
```

### FileTransportConfig

```typescript
interface FileTransportConfig extends TransportConfig {
  filename: string;              // Path to log file
  maxSize?: number;              // Max file size in bytes (default: 10MB)
  maxFiles?: number;              // Max number of rotated files (default: 5)
  format?: 'json' | 'text';      // Output format (default: 'text')
  datePattern?: string;          // Rotation pattern (default: 'YYYY-MM-DD')
}
```

## RemoteTransport

Sends log messages to remote servers with batching and error handling.

```typescript
import { RemoteTransport } from '@ru-dr/plip';

const remoteTransport = new RemoteTransport({
  name: 'remote',
  url: 'https://logs.example.com/api/logs',
  level: ['error'],
  batchSize: 10,
  flushInterval: 5000,
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  timeout: 10000
});
```

### RemoteTransportConfig

```typescript
interface RemoteTransportConfig extends TransportConfig {
  url: string;                   // Remote endpoint URL
  apiKey?: string;               // Optional API key for authentication
  batchSize?: number;            // Logs per batch (default: 10)
  flushInterval?: number;        // Flush interval in ms (default: 5000)
  headers?: Record<string, string>; // Custom headers
  timeout?: number;              // Request timeout in ms (default: 5000)
}
```

## BrowserTransport

Browser-specific transport with localStorage support and console grouping.

```typescript
import { BrowserTransport } from '@ru-dr/plip';

const browserTransport = new BrowserTransport({
  name: 'browser',
  level: ['debug', 'info', 'warn', 'error'],
  useLocalStorage: true,
  storageKey: 'app-logs',
  maxStorageSize: 5242880, // 5MB
  enableConsoleGroup: true
});
```

### BrowserTransportConfig

```typescript
interface BrowserTransportConfig extends TransportConfig {
  useLocalStorage?: boolean;     // Store logs in localStorage (default: false)
  storageKey?: string;           // localStorage key (default: 'plip-logs')
  maxStorageSize?: number;       // Max storage size in bytes (default: 5MB)
  enableConsoleGroup?: boolean;  // Group logs in console (default: false)
}
```

## Usage Examples

### Multiple Transports

```typescript
import { createPlip } from '@ru-dr/plip';
import { ConsoleTransport, FileTransport, RemoteTransport } from '@ru-dr/plip';

const logger = createPlip();

// Add console transport (default behavior)
logger.addTransport(new ConsoleTransport({ name: 'console' }));

// Add file transport for persistence
logger.addTransport(new FileTransport({
  name: 'file',
  filename: './logs/app.log',
  level: ['warn', 'error']
}));

// Add remote transport for error tracking
logger.addTransport(new RemoteTransport({
  name: 'remote',
  url: 'https://api.logservice.com/v1/logs',
  level: ['error'],
  headers: { 'X-API-Key': 'your-key' }
}));
```

### Transport Management

```typescript
// Remove a transport
logger.removeTransport('file');

// Clear all transports
logger.clearTransports();

// Add transport conditionally
if (process.env.NODE_ENV === 'production') {
  logger.addTransport(new RemoteTransport({
    name: 'prod-remote',
    url: process.env.LOG_URL!,
    level: ['error']
  }));
}
```

## Custom Transports

Create custom transports by extending `BaseTransport`:

```typescript
import { BaseTransport } from '@ru-dr/plip';
import type { TransportConfig, FormattedLogEntry } from '@ru-dr/plip';

class CustomTransport extends BaseTransport {
  constructor(config: TransportConfig) {
    super(config);
  }

  log(entry: FormattedLogEntry): void {
    // Custom logging logic
    console.log(`[${entry.level}] ${entry.message}`);
  }
}

const customTransport = new CustomTransport({
  name: 'custom',
  level: ['info', 'error']
});

logger.addTransport(customTransport);
```