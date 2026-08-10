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
  configure?(config: Partial<TransportConfig>): void;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}
```

`flush()` is optional. When present it is called by `Logger.flush()` and should drain whatever the transport has buffered. Transports that write synchronously do not need it.

## TransportConfig

Base configuration interface for all transports.

```typescript
interface TransportConfig {
  name: string;           // Unique transport identifier
  level?: LogLevel[];     // Log levels to handle (default: all)
  silent?: boolean;       // Disable this transport (default: false)
  onError?: LogErrorHandler; // Receives delivery failures (default: console.error)
}
```

### Error Reporting

Transport failures are not swallowed. When a transport throws or rejects, the error is passed to `onError` as `(error, transportName)`; with no handler set it is reported with `console.error`. One failing transport never stops the others.

```typescript
const fileTransport = new FileTransport({
  name: 'file',
  filename: '/var/log/app.log',
  onError: (error, transportName) => {
    metrics.increment('log_transport_failure', { transport: transportName });
  }
});
```

A logger-level `onError` (see [Configuration API](/api/configuration)) covers transports that do not define one of their own.

## ConsoleTransport

Logs messages to the console.

Formatting is owned by the logger: the level prefix (for example `[INFO]`), colors, and object highlighting are all applied before the entry reaches the transport. The console transport only decides whether to keep the ANSI codes the logger produced.

```typescript
import { ConsoleTransport } from '@ru-dr/plip';

const consoleTransport = new ConsoleTransport({
  name: 'console',
  level: ['info', 'warn', 'error'],
  useColors: true
});
```

The constructor does not take a theme:

```typescript
const consoleTransport = new ConsoleTransport({ name: 'console' });
```

### ConsoleTransportConfig

```typescript
interface ConsoleTransportConfig extends TransportConfig {
  useColors?: boolean;           // Keep ANSI codes (default: true); set false to strip them before printing
}
```

## FileTransport

Writes log messages to files with optional rotation and formatting.

With `format: 'text'`, the `TextFormatter` writes the raw `entry.message`, so log files never contain ANSI color codes.

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
  maxSize?: number;              // Max file size in bytes; rotation is disabled when unset
  maxFiles?: number;              // Max number of rotated files (default: 5)
  format?: 'json' | 'text';      // Output format (default: 'text')
  datePattern?: string;          // Reserved for date-based rotation; currently unused
}
```

`log()` returns a promise that resolves once the entry has been appended, so writes can be awaited. Rotation is size-based: when `maxSize` is set and the file exceeds it, the file is renamed to `app.1.log`, `app.2.log`, … up to `maxFiles`, and the oldest is deleted.

**Methods**:
- `flush(): Promise<void>` — drains the write queue, repeating until nothing is left pending
- `close(): Promise<void>` — calls `flush()`

Because `flush()` is part of the `Transport` interface, `logger.flush()` drains a file transport for you — useful before `process.exit`.

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
  timeout?: number;              // Request timeout in ms; no timeout is applied when unset
}
```

When `apiKey` is set it is sent as an `Authorization: Bearer <apiKey>` header. Batches are POSTed as `{ logs, timestamp }`; a failed request re-queues the batch (capped at 1000 buffered entries).

**Methods**:
- `flush(): Promise<void>` — sends any buffered logs immediately; also called by `Logger.flush()`
- `forceFlush(): Promise<void>` — **deprecated**, an alias of `flush()`. Still works; prefer `flush()`
- `getBatchSize(): number` — number of logs currently buffered
- `close(): Promise<void>` — stops the flush timer and flushes remaining logs

```typescript
logger.addTransport(remoteTransport);
logger.error("Fatal failure");

await logger.flush(); // Delivers the batch before the process ends
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
  maxStorageSize?: number;       // Max storage size in bytes (default: 1MB)
  enableConsoleGroup?: boolean;  // Group logs in console (default: false)
}
```

Console grouping is only used when the entry has a non-empty context; otherwise the formatted message is printed directly. Oldest entries are dropped once stored logs exceed `maxStorageSize`.

**Methods**:
- `getLogs(): StoredLogEntry[]` — returns the entries persisted in localStorage
- `clearLogs(): void` — removes the stored entries

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
// Drain every transport (before process exit, for example)
await logger.flush();

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
  private buffer: string[] = [];

  constructor(config: TransportConfig) {
    super(config);
  }

  log(entry: FormattedLogEntry): void {
    // Custom logging logic
    this.buffer.push(`[${entry.level}] ${entry.message}`);
  }

  // Optional: called by logger.flush()
  async flush(): Promise<void> {
    const pending = this.buffer.splice(0, this.buffer.length);

    try {
      await deliver(pending);
    } catch (error) {
      // Routes to TransportConfig.onError, or console.error
      this.reportError(error);
    }
  }
}

const customTransport = new CustomTransport({
  name: 'custom',
  level: ['info', 'error']
});

logger.addTransport(customTransport);
```