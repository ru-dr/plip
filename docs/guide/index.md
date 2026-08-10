# Getting Started

Welcome to Plip Logger - the delightful, colorful logging experience for modern Node.js applications!

## What is Plip?

Plip is a lightweight, feature-rich logging library that makes debugging and monitoring your applications a joy. With intelligent color detection and beautiful syntax highlighting, your logs become not just functional but enjoyable to read.

## Key Features

- **Smart Colors** - Automatic terminal detection with beautiful color schemes
- **7 Log Levels** - From verbose to error, perfect granularity
- **Syntax Highlighting** - JSON objects rendered beautifully
- **SSR/CSR Optimized** - Dedicated configurations for server and client environments
- **Fluent API** - Chain methods for elegant configuration
- **Zero Config** - Works great out of the box
- **TypeScript First** - Full type safety and IntelliSense
- **Environment Aware** - Respects NODE_ENV and terminal capabilities

## Quick Start

Get up and running with Plip in under a minute:

### 1. Install Plip

::: code-group

```bash [npm]
npm install @ru-dr/plip
```

```bash [yarn]
yarn add @ru-dr/plip
```

```bash [pnpm]
pnpm add @ru-dr/plip
```

```bash [bun]
bun add @ru-dr/plip
```

:::

### 2. Import and Use

```typescript
import { plip } from '@ru-dr/plip';

// Basic logging
plip.info("Welcome to Plip!");
plip.success("Task completed successfully");
plip.warn("This might need attention");
plip.error("Something went wrong");

// Beautiful object logging
plip.info("User data:", {
  name: "Alex Developer",
  skills: ["TypeScript", "Node.js"],
  active: true
});
```

### 3. See the Magic

Your terminal will display beautifully formatted, colorful logs that make debugging a delight!

## Next Steps

- [Install Plip](/guide/install) - Detailed installation guide
- [Basic Usage](/guide/basic-usage) - Learn the fundamentals
- [SSR vs CSR Logging](/guide/ssr-csr) - Server-side and client-side optimized configurations
- [Configuration](/guide/configuration) - Customize Plip to your needs
- [Custom Loggers](/examples/custom-loggers) - **Context-aware logging** and advanced patterns
- [Best Practices](/guide/best-practices) - Write better logs

## Why Choose Plip?

Traditional logging is boring and hard to scan. Plip transforms logging into a delightful experience:

- **Visual Clarity**: Colors help you quickly identify log types
- **Developer Experience**: Beautiful syntax highlighting for complex objects
- **Production Ready**: Respects environment settings and terminal capabilities
- **Zero Configuration**: Works perfectly out of the box
- **Flexible**: Highly customizable when you need it

Ready to make your logs beautiful? Let's dive in!
