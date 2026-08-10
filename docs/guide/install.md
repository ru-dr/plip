# Installation

This guide covers all the ways to install and set up Plip Logger in your project.

## Package Manager Installation

### JavaScript/TypeScript (Current)

::: code-group

```sh [npm]
$ npm install @ru-dr/plip
```

```sh [yarn]
$ yarn add @ru-dr/plip
```

```sh [pnpm]
$ pnpm add @ru-dr/plip
```

```sh [bun]
$ bun add @ru-dr/plip
```

:::

Plip has zero runtime dependencies, so installing it adds nothing else to your
lockfile. The package is marked `"sideEffects": false` and is tree-shakeable.

## Requirements

### Node.js Version

Plip requires Node.js 16 or higher:

- Node.js 16.x
- Node.js 18.x
- Node.js 20.x
- Node.js 21.x

### TypeScript Support

For TypeScript projects, Plip provides full type definitions out of the box. No additional `@types` packages are needed.

**Supported TypeScript versions:**
- TypeScript 4.5+
- TypeScript 5.x

## Import Methods

Plip ships a dual build: ESM at `dist/esm/index.js`, CommonJS at
`dist/cjs/index.js`, and type definitions at `dist/esm/index.d.ts`. Both
`import` and `require` work without extra configuration.

### ES Modules (Recommended)

```typescript
import { plip } from '@ru-dr/plip';

plip.info("Hello from ESM! ");
```

### CommonJS

```javascript
const { plip } = require('@ru-dr/plip');

plip.info("Hello from CommonJS! ");
```

### Destructured Import

```typescript
import { createPlip } from '@ru-dr/plip';
import type { LogLevel } from '@ru-dr/plip';

const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const logger = createPlip({ enabledLevels: levels });
logger.debug("Custom logger created! ");
```

## Verification

After installation, verify Plip is working correctly:

```typescript
import { plip } from '@ru-dr/plip';

plip.success("Plip is installed and ready!");
```

## Next Steps

Now that Plip is installed:

- [Basic Usage](/guide/basic-usage) - Learn the fundamentals
- [Configuration](/guide/configuration) - Customize your setup
- [Best Practices](/guide/best-practices) - Follow recommended patterns

## Troubleshooting

### Module Not Found Error

If you encounter a "module not found" error:

1. Ensure you're using Node.js 16+
2. Check your package.json for the correct dependency
3. Clear your node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Issues

For TypeScript compilation issues:

1. Ensure your tsconfig.json includes ES2020+ target
2. Set moduleResolution to "node" or "bundler"
3. Enable esModuleInterop if using CommonJS imports

### Terminal Colors Not Working

If colors aren't displaying:

1. Check if your terminal supports colors
2. Verify the FORCE_COLOR environment variable
3. See [Compatibility Guide](/guide/compatibility) for terminal-specific settings
