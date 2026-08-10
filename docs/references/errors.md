# Errors & Troubleshooting

Plip Logger does not define a numeric error-code system. Instead, it is designed to never break your application because of logging: transports catch their own failures and report them on the native `console`, prefixed with the transport name. This reference lists the diagnostic messages the library can emit, what causes them, and how to resolve them.

## How Plip Reports Problems

- Logging calls (`info`, `warn`, `error`, ...) do not throw. A failing transport is isolated.
- Transport failures are written to the native `console` with a `TransportName:` prefix.
- There is no error event emitter, no error codes, and no configuration file loading, so none of the classic "invalid config file" failures apply.

## File Transport Messages

### `FileTransport: File writing not supported in this environment`

**Cause:** A `FileTransport` was attached in a non-Node runtime (browser, edge worker, Deno without Node compatibility). File writing requires Node's `fs`.

**Solutions:**
1. Only attach `FileTransport` when running in Node
2. Use `BrowserTransport` or `RemoteTransport` in the browser
3. Guard the attachment with a runtime check

```javascript
import { createPlip, FileTransport, isNode } from '@ru-dr/plip';

const logger = createPlip();

if (isNode()) {
  logger.addTransport(new FileTransport({
    name: 'file',
    filename: './logs/app.log'
  }));
}
```

### `FileTransport: Failed to write to file: <error>`

**Cause:** The underlying `fs` operation failed. The original error is included, most often `EACCES` (permission denied), `EROFS` (read-only filesystem) or `ENOSPC` (out of disk space).

**Solutions:**
1. Check file and directory permissions: `chmod 644 /var/log/app.log`
2. Run the process as a user that can write the target directory
3. Free disk space, or point `filename` at a writable path

Note that the transport creates missing parent directories automatically, so a missing directory is not itself an error.

### Rotation Not Happening

**Cause:** `maxSize` was omitted. Without it, the transport never rotates.

**Solutions:**
1. Set `maxSize` in bytes (not a string like `'10MB'`)
2. Set `maxFiles` to cap the number of rotated files (defaults to 5)

```javascript
new FileTransport({
  name: 'file',
  filename: './logs/app.log',
  maxSize: 10 * 1024 * 1024,
  maxFiles: 5
});
```

## Remote Transport Messages

### `RemoteTransport: Failed to send logs: <error>`

**Cause:** The HTTP request to `url` failed. The wrapped error distinguishes the case:

- `HTTP 401: Unauthorized` / `HTTP 403: Forbidden` - bad or missing `apiKey`
- `HTTP 429: Too Many Requests` - the endpoint is rate limiting the batches
- A `fetch` network error - the endpoint is unreachable or DNS fails
- An `AbortError` - the request exceeded the configured `timeout`

**Solutions:**
1. Verify `url`, `apiKey` and any custom `headers`
2. Increase `batchSize` or `flushInterval` to send fewer, larger requests
3. Increase `timeout`, or omit it to disable the abort behaviour
4. Check outbound network access and firewall rules

Failed batches are re-queued ahead of newer entries so ordering survives a retry. The internal buffer is capped at 1000 entries, so a persistently failing endpoint drops the oldest logs rather than leaking memory.

### Logs Arrive Late or Not At All

**Cause:** The remote transport batches. Entries stay buffered until `batchSize` is reached or `flushInterval` elapses, and the flush timer is `unref`'d so it never keeps a Node process alive.

**Solutions:**
1. Call `await transport.forceFlush()` before a short-lived process exits
2. Call `await transport.close()` during shutdown to flush and stop the timer
3. Inspect `transport.getBatchSize()` to see how many entries are pending

## Browser Transport Messages

### `BrowserTransport: Failed to store log in localStorage: <error>`

**Cause:** `localStorage` rejected the write, usually a `QuotaExceededError`, or storage is unavailable (private browsing, disabled cookies, sandboxed iframe).

**Solutions:**
1. Lower `maxStorageSize` so fewer entries are retained
2. Set `useLocalStorage: false` and rely on console output or a remote transport
3. Clear the stored logs periodically

### `BrowserTransport: Failed to retrieve logs from localStorage: <error>` / `... Failed to clear logs from localStorage: <error>`

**Cause:** The stored value is unreadable or unparsable, or storage access is blocked.

**Solutions:**
1. Remove the stale key (`storageKey`, default `plip-logs`) and let the transport recreate it
2. Verify the page has access to `localStorage` in its current context

## Configuration Problems

Plip validates nothing at construction time: unknown keys are simply ignored, and `createPlip()` never throws. That means configuration mistakes show up as missing or unexpected output rather than as errors.

### No Output At All

**Causes and solutions:**
1. `silent: true` is set - remove it, or create the logger without it
2. `devOnly: true` while `NODE_ENV` is `production` - remove `devOnly` for production logging
3. The level is not in `enabledLevels` - add it, or use `logger.levels('info', 'warn', 'error')`

```javascript
import { createPlip } from '@ru-dr/plip';

const logger = createPlip({
  enabledLevels: ['info', 'warn', 'error', 'success', 'debug']
});

logger.info('Application started');
// [INFO] Application started
```

### Unrecognised Configuration Keys

The only supported keys are `silent`, `enableColors`, `enableSyntaxHighlighting`, `theme`, `enabledLevels`, `devOnly`, `enableTimestamp`, `enableStructuredOutput`, `includeRequestId` and `includeContext`. Anything else, including `level`, `format`, `timestamp` or `colorize`, is ignored silently. See the [Configuration API](/api/configuration) for the full list.

### Invalid Log Level

`LogLevel` is the string union `'info' | 'warn' | 'error' | 'success' | 'debug' | 'trace' | 'verbose'`. Any other value in `enabledLevels` simply never matches, so the corresponding output disappears. TypeScript catches this at compile time.

### Missing Colors

**Causes and solutions:**
1. `NO_COLOR` is set, or `TERM=dumb` - unset it, or pass `enableColors: true`
2. Output is piped to a non-TTY, or a CI environment was detected - set `FORCE_COLOR`
3. `enableColors: false` is set in the configuration - use `logger.withColors(true)`

Plip reads only `NODE_ENV`, `NO_COLOR`, `FORCE_COLOR`, `TERM` and the CI markers (`CI`, `GITHUB_ACTIONS`, `GITLAB_CI`, `CIRCLECI`, `TRAVIS`). It does not read any `PLIP_*` variables; if you want environment-driven configuration, read the variables yourself and pass the result to `createPlip()`.

## Error Handling Patterns

### Logging Errors Safely

Logging calls never throw, so the pattern that matters is making sure your own error objects serialise usefully:

```javascript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    message: error.message,
    stack: error.stack
  });
}
```

### Transport Fallback

Because failures are reported on the console rather than surfaced as events, choose transports up front based on the runtime instead of reacting to errors:

```javascript
import { createPlip, FileTransport, BrowserTransport, isNode } from '@ru-dr/plip';

const logger = createPlip();

logger.addTransport(isNode()
  ? new FileTransport({ name: 'file', filename: './logs/app.log' })
  : new BrowserTransport({ name: 'browser' })
);
```

### Clean Shutdown

Flush buffered entries before the process exits so nothing is lost:

```javascript
process.on('SIGTERM', async () => {
  for (const transport of logger.getTransports()) {
    await transport.close?.();
  }
  process.exit(0);
});
```

## Debugging

### Turn Every Level On

```javascript
const logger = createPlip({
  enabledLevels: ['info', 'warn', 'error', 'success', 'debug', 'trace', 'verbose']
});
```

### Inspect the Environment

```javascript
import { getRuntimeEnvironment, supportsColor, isDevelopment } from '@ru-dr/plip';

console.log({
  runtime: getRuntimeEnvironment(),
  colors: supportsColor(),
  development: isDevelopment()
});
```

### Inspect Attached Transports

```javascript
console.log(logger.getTransports().map(t => t.name));
```

This reference covers every diagnostic message Plip Logger can emit, plus the silent-misconfiguration cases that are easy to mistake for errors.
