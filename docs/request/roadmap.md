# Roadmap & Features

This page outlines the current features, planned enhancements, and version history for Plip Logger.

## Current Version

**Plip v2.0.0** (Released August 2026)

## Feature Overview

### Core Features

- Colorful logger with syntax highlighting
- Seven distinct log levels (info, success, warn, error, debug, trace, verbose)
- Smart terminal color detection
- Fluent API with method chaining
- Full TypeScript support
- Environment-aware logging (Node.js, Bun, Deno, Browser; dev/prod modes)
- Customizable themes (per-level colors)
- Transport system (console, file, browser, remote)
- Performance timers via `startTimer()`
- Severity threshold via `minLevel`, transport error reporting via `onError`
- `flush()` to drain all transports
- Zero-configuration setup

### Technical Capabilities

- Flexible Configuration System (programmatic, global or per-instance)
- Modular Architecture (core logger, transports, formatters, utilities)
- Extensibility (custom transports, custom themes)
- Broad compatibility (multiple package managers, SSR/CSR)
- Zero runtime dependencies, tree-shakeable (`"sideEffects": false`)
- Dual ESM + CommonJS build - both `import` and `require` are supported
- ESLint 9 flat config with `bun run lint` / `bun run lint:fix`
- Continuous integration (`.github/workflows/ci.yml`): typecheck, lint, tests with
  coverage, build, entrypoint smoke test and docs build

## Planned Features

### Next Release

- Built-in metrics collection
- React Native support
- Rotating file transport

### Future Releases

- Encrypted logging
- Query language for logs
- Interactive log visualization dashboard
- Real-time log streaming
- OpenTelemetry integration
- Log grouping
- Web-based inspector

## Version History

### v2.0.0 (Current) - August 2026

Breaking: emoji support removed, `ConsoleTransportConfig.useSyntaxHighlighting`,
`colors.reset` and `colors.strikethrough` removed, duplicate `src/lib/` deleted.

- Severity threshold via `minLevel`, plus `LOG_LEVEL_SEVERITY` / `levelsAtOrAbove()`
- `flush()` on the logger and as an optional transport hook
- `onError` for transport failures, which were previously swallowed
- `enableTimestamp` and `enableStructuredOutput` implemented
- Zero runtime dependencies and a dual ESM/CommonJS build
- ESLint flat config and CI
- Correctness fixes across the console, file, remote and browser transports

### v1.2.0 - September 2025

- Transport system with Console, File, Browser, and Remote transports
- RemoteTransport with batching and error handling
- Enhanced logging configuration types and logger factory

### v1.1.0 - June 2025

- Added enterprise logger patterns
- Improved performance for high-volume environments
- Added Docker and CI/CD integration examples
- Enhanced customization options
- Framework-specific bindings for popular libraries

### v1.0.0 - June 2025

- Initial stable release with core functionality
- Seven log levels (info, success, warn, error, debug, trace, verbose)
- Terminal color support
- Comprehensive documentation

## Contribution Areas

We welcome community contributions in these areas:

- Framework integrations
- Performance improvements
- Documentation and examples
- Testing tools and methodologies

See our [Contributing Guide](../request/contributing.md) to get involved.

## Compatibility

Plip aims for broad compatibility across modern JavaScript environments.

| Platform / Technology | Version / Details                        |
|-----------------------|------------------------------------------|
| Node.js               | `engines: >=16`                          |
| TypeScript            | 5.x (peer dependency `^5`)               |
| Bun                   | Used for the test suite and build        |
| Deno, browsers        | Detected at runtime by `getRuntimeEnvironment()` |

For more detailed compatibility information, see our [Compatibility Guide](../guide/compatibility.md).
