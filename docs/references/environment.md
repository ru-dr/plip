# Environment Variables

Plip Logger responds to several standard environment variables that affect color output and terminal behavior. Plip does not have custom environment variables for configuration - instead, use the configuration options when creating a logger instance.

## Color Control Variables

Plip Logger automatically detects and respects standard color environment variables:

### NO_COLOR

Disables all color output when set (any value).

```bash
NO_COLOR=1 node app.js
```

**Effect:** Forces all logger output to be plain text without colors, regardless of other settings.

### FORCE_COLOR

Forces color output even when not connected to a TTY.

```bash
FORCE_COLOR=1 node app.js
```

**Note:** Plip only checks whether `FORCE_COLOR` is set to a non-empty value. Any non-empty value (including `0`) enables colors. To disable colors, use `NO_COLOR` or set `enableColors: false`.

### TERM

Terminal type identifier used for color capability detection.

```bash
TERM=xterm-256color
```

**Common values:**
- `dumb` - Treated as no color support
- `xterm-256color` - Treated as color capable (contains `color`/`256`)
- `xterm`, `screen` - Not recognized by name; detection falls back to the TTY check

**Note:** `TERM` is only consulted when `process.stdout.isTTY` is not a boolean, since the TTY check takes precedence.

## Development Environment Variables

### NODE_ENV

Determines whether Plip considers the process to be in development or production.

```bash
NODE_ENV=production
```

**Effect:** `isProduction()` returns `true` only when `NODE_ENV === "production"`; `isDevelopment()` returns `true` otherwise. This drives the `devOnly` option (logs are suppressed outside development) and the SSR/CSR presets, which disable colors and all levels by default in production.

### CI

Indicates running in a Continuous Integration environment.

```bash
CI=true
```

**Effect:** When `CI` is set *and* one of `GITHUB_ACTIONS`, `GITLAB_CI`, `CIRCLECI` or `TRAVIS` is also set, color support is assumed. `CI` on its own has no effect.

## Configuration via Code

Since Plip doesn't use custom environment variables, configure the logger programmatically:

```javascript
import { createPlip } from '@ru-dr/plip';

// Configure colors based on environment
const isProduction = process.env.NODE_ENV === 'production';
const disableColors = process.env.NO_COLOR || isProduction;

const logger = createPlip({
  enableColors: !disableColors,
  silent: process.env.NODE_ENV === 'test'
});
```

## Environment-Specific Setup

### Development

```javascript
// config/development.js
import { createPlip } from '@ru-dr/plip';

export const logger = createPlip({
  enableColors: true,
  enableSyntaxHighlighting: true,
  enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});
```

### Production

```javascript
// config/production.js
import { createPlip } from '@ru-dr/plip';

export const logger = createPlip({
  enableColors: false,
  enableSyntaxHighlighting: false,
  enabledLevels: ['info', 'success', 'warn', 'error']
});
```

### Testing

```javascript
// config/test.js
import { createPlip } from '@ru-dr/plip';

export const logger = createPlip({
  silent: true // Disable all logging during tests
});
```

## Docker and Container Environments

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    environment:
      - NODE_ENV=production
      - NO_COLOR=1  # Disable colors in containers
      - TERM=dumb   # Indicate simple terminal
```

### Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: NODE_ENV
          value: "production"
        - name: NO_COLOR
          value: "1"
```

## Best Practices

### 1. Respect Standard Variables

Always check for standard environment variables:

```javascript
import { createPlip } from '@ru-dr/plip';

const shouldUseColors = !process.env.NO_COLOR && 
                       !!(process.env.FORCE_COLOR || process.stdout.isTTY);

const logger = createPlip({
  enableColors: shouldUseColors
});
```

### 2. Environment Detection

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isCI = !!process.env.CI;

const logger = createPlip({
  silent: isTest,
  enableColors: isDevelopment && !isCI
});
```

### 3. Graceful Degradation

```javascript
// Detect terminal capabilities
const hasColorSupport = process.env.TERM !== 'dumb' && 
                       !process.env.NO_COLOR;

const logger = createPlip({
  enableColors: hasColorSupport,
  enableSyntaxHighlighting: hasColorSupport
});
```

This approach ensures Plip Logger works well across different environments while respecting standard terminal and color conventions.
