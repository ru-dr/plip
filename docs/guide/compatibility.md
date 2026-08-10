# Compatibility

Learn about Plip's compatibility with different environments, terminals, and platforms.

## Node.js Compatibility

### Supported Versions

The package declares `"engines": { "node": ">=16" }`. An active LTS release is
recommended.

### ES Module Support

Plip ships a dual build and fully supports both ES modules and CommonJS - ESM at
`dist/esm/index.js`, CommonJS at `dist/cjs/index.js`, types at
`dist/esm/index.d.ts`:

```typescript
// ES Modules (Recommended)
import { plip } from '@ru-dr/plip';

// CommonJS
const { plip } = require('@ru-dr/plip');
```

## Terminal Compatibility

### Color Support Detection

Plip emits basic 16-color ANSI codes, which every modern terminal understands.
`supportsColor()` decides whether to emit them at all, in this order:

1. `NO_COLOR` set - colors off.
2. `FORCE_COLOR` set - colors on.
3. `process.stdout.isTTY` - follows the stream.
4. `TERM` - `dumb` is off; values containing `color` or `256` are on.
5. `CI` together with `GITHUB_ACTIONS`, `GITLAB_CI`, `CIRCLECI` or `TRAVIS` - on.

In a browser, `supportsColor()` returns false.

### Manual Color Control

Override automatic detection when needed:

```typescript
import { createPlip } from '@ru-dr/plip';

// Force colors on (configure/withColors return a new logger)
const colorful = plip.withColors(true);

// Force colors off
const plain = plip.withColors(false);

// Auto-detect (default): omit enableColors when creating a logger
const auto = createPlip({});
```

## Platform Support

### Operating Systems

Plip contains no platform-specific code: it writes strings to `console` and,
for the file transport, uses `node:fs`. Anywhere your JavaScript runtime runs,
Plip runs. Colors depend on the terminal rather than the OS - see
[Color Support Detection](#color-support-detection).

### Environment Variables

Plip respects standard environment variables during color detection:

```bash
# Force color output (any non-empty value enables colors)
FORCE_COLOR=1 node app.js

# Disable color output (any non-empty value wins over FORCE_COLOR)
NO_COLOR=1 node app.js

# TERM is consulted when stdout is not a TTY
TERM=xterm-256color node app.js
```

`NODE_ENV` is also read to decide development vs production behavior. Plip does
not read any `PLIP_*` environment variables of its own - pass configuration to
`createPlip()` instead.

## Runtime Environments

### Cloud Platforms

Serverless and PaaS log collectors usually capture stdout without a TTY, so
`supportsColor()` returns false and output is plain text. That is normally what
you want; pair it with `enableStructuredOutput: true` so the collector receives
one JSON object per line. Set `FORCE_COLOR=1` if a platform does render ANSI.

### Container Environments

```dockerfile
# Dockerfile example with color support
FROM node:20-alpine

# Enable color output in containers
ENV FORCE_COLOR=1

COPY . .
RUN npm install

CMD ["node", "app.js"]
```

### CI/CD Environments

`supportsColor()` recognises GitHub Actions, GitLab CI, CircleCI and Travis by
their environment variables when `CI` is also set. Anywhere else, set
`FORCE_COLOR=1` to opt in.

```yaml
# GitHub Actions example
- name: Run tests with colors
  run: npm test
  env:
    FORCE_COLOR: 1
```

## TypeScript Compatibility

### Supported Versions

TypeScript 5.x. The package declares `typescript: ^5` as a peer dependency.

### Configuration Requirements

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

## Framework Integration

### Popular Frameworks

Plip is framework-agnostic: it writes to transports, so any framework can use it.
These guides cover the common wiring:

- [Express](/integration/express)
- [Fastify](/integration/fastify)
- [NestJS](/integration/nestjs)
- [Next.js](/integration/nextjs)

There are also dedicated adapters for React and Next.js (`ReactAdapter`,
`NextJSAdapter`).

## Performance Considerations

### Production Optimizations

```typescript
// Optimize for production
const logger = process.env.NODE_ENV === 'production'
  ? plip.configure({
      enabledLevels: ['info', 'warn', 'error'], // Reduce log verbosity
      enableColors: false,                      // Better for log aggregation
      enableTimestamp: true                     // Enable for production tracking
    })
  : plip;
```

### Memory Usage

Plip has minimal memory overhead:

- **Zero dependencies**: no runtime dependencies at all - ANSI codes are inlined
- **Tree-shakeable**: the package declares `"sideEffects": false`

## Troubleshooting

### Colors Not Showing

1. **Check terminal support**:
   ```bash
   echo $COLORTERM
   echo $TERM
   ```

2. **Force color output**:
   ```bash
   FORCE_COLOR=1 node app.js
   ```

3. **Verify color detection** (the logger's config is private, but the same
   helper Plip uses is exported):
   ```typescript
   import { supportsColor } from '@ru-dr/plip';

   plip.info("Colors supported:", supportsColor());
   ```

### Performance Issues

1. **Reduce enabled levels in production**:
   ```typescript
   const quiet = plip.levels('warn', 'error');
   ```

2. **Disable expensive features**:
   ```typescript
   const lean = plip.configure({
     enableColors: false,
     enableSyntaxHighlighting: false,
     enableTimestamp: false
   });
   ```

## Getting Help

If you encounter compatibility issues:

1. Check the [troubleshooting guide](#troubleshooting)
2. Search [existing issues](https://github.com/ru-dr/plip/issues)
3. Create a [new issue](https://github.com/ru-dr/plip/issues/new) with:
   - Node.js version
   - Operating system
   - Terminal/environment
   - Plip configuration
   - Expected vs actual behavior

## Next Steps

- [Configuration Guide](/guide/configuration) - Detailed configuration options
- [Integration Examples](/integration/express) - Real-world usage patterns
- [Troubleshooting](/request/support) - Common issues and solutions