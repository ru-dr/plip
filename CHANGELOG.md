# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-10

### Removed
- **BREAKING**: Emoji support removed entirely. `enableEmojis`, `logger.withEmojis()`,
  `supportsEmoji()`, `PlipTheme.emojis` and `ConsoleTransportConfig.useEmojis` no longer
  exist. Log output is now `[LEVEL] message`.
- **BREAKING**: `ConsoleTransportConfig.useSyntaxHighlighting` removed. The logger owns
  formatting; the console transport only decides whether to keep ANSI colors (`useColors`).
- Duplicate `src/lib/` directory deleted. Import from the package root or `src/core/`.

### Added
- `minLevel` config key and chainable `logger.minLevel(level)`: a severity
  threshold, so "warn and above" no longer requires listing levels by hand.
  Exported alongside `LOG_LEVEL_SEVERITY`, `levelsAtOrAbove()` and
  `meetsMinLevel()`.
- `logger.flush(): Promise<void>`, plus an optional `Transport.flush()` hook.
  File and remote transports implement it, so buffered logs can be drained
  before a process exits.
- `onError` on both `PlipConfig` and `TransportConfig`. Transport failures used
  to be swallowed by `Promise.allSettled`; they now reach the handler, or
  `console.error` when none is set.
- CommonJS build. `require('@ru-dr/plip')` works: ESM at `dist/esm`, CJS at
  `dist/cjs`, resolved through the `exports` map.
- ESLint 9 flat config with `lint`/`lint:fix` scripts, a `typecheck` script, and
  a CI workflow running typecheck, lint, tests with coverage, build and an
  entrypoint smoke test.
- Test suite grown from 78 to 147 tests. RemoteTransport went from 6% to 93%
  line coverage, BrowserTransport 32% to 100%, FileTransport 73% to 100%, and
  the React/Next.js adapters from ~50% to ~99%.
- `enableTimestamp` and `enableStructuredOutput` are now implemented. They were
  accepted as config but ignored: timestamps prefix console output with an ISO
  string, and structured output emits one JSON object per line.

### Fixed
- `withColors()`, `withSyntaxHighlighting()` and `levels()` had no effect on
  console output, because the default console transport re-formatted entries from its own
  construction-time config. The transport now honours the logger's formatting.
- Derived loggers (`configure()`, `withContext()`, `child()`) no longer end up with
  half-closed copies of shared transports; a logger family shares one transport manager.
- `isDevelopment()`/`isProduction()` no longer throw in browser bundles that lack a
  `process` shim.
- `FileTransport` no longer drops entries queued during an in-flight write, and writes are
  serialized and awaited instead of using blocking `appendFileSync`.
- `TextFormatter` writes the raw message, so ANSI color codes no longer leak into log
  files. `LogEntry.message` is now always uncolored; only `formattedMessage` carries color.
- `Error` arguments now log their message and stack instead of serializing to `{}`.
- `getRuntimeEnvironment()` reports `"deno"` on Deno instead of `"node"`.
- `RemoteTransport` no longer keeps a Node process alive via its flush timer,
  and no longer round-trips every entry through `JSON.parse`.
- `BrowserTransport` localStorage trimming no longer re-serializes the whole log
  array once per dropped entry.
- JSON syntax highlighting no longer corrupts values that contain quotes or
  colons (for example URLs); it now matches whole JSON tokens.

### Changed
- **Zero runtime dependencies**: `cli-color` was replaced with inlined ANSI
  escape codes, so nothing extra ships to browser bundles. `"sideEffects": false`
  marks the package tree-shakeable.
- `requestId` now prefers a `requestId` found in the logger context, so
  `child({ requestId })` correlates a real request. The generated fallback uses
  `crypto.randomUUID()` instead of `Math.random()`.
- `README.md`, `LICENSE` and `CHANGELOG.md` are copied into the package at build
  time, so they actually reach the published tarball.
- Added an `exports` map to `package.json`. The `files` field no longer lists
  paths outside the package directory, which npm ignored.
- `PlipTheme` colors are typed as `ColorFn` instead of `any`, and `ColorFn` is
  exported.
- Removed `colors.strikethrough`, which returned its input unchanged, and
  `colors.reset`, which was a screen-clearing string rather than a color
  function.
- Documentation no longer advertises ports to other languages. Plip is a
  JavaScript/TypeScript library.
- Documentation corrected throughout: removed references to APIs that never
  existed (`time()`/`timeEnd()`, `new Logger()`, `createLogger()`, `fatal()`,
  `withPrefix()`, `logger.config`, `.pliprc.json` config files, `PLIP_*`
  environment variables, the `PLIP_E*` error-code system) and fixed example
  output to match real formatting.

## [1.2.0] - 2025-09-29

### Added
- RemoteTransport for logging to remote servers with batching and error handling
- Transport system with Console, File, Browser, and Remote transports
- Enhanced logging configuration types and logger factory

### Tests
- Comprehensive tests for formatters, transports, and performance utilities

### Changed
- Organized code structure and improved documentation

## [1.1.0] - 2025-06-02

### Added
- Enterprise logger patterns for high-volume production environments
- Docker integration examples and containerization support
- CI/CD pipeline integration templates and configurations
- Enhanced customization options for themes and output formats
- Framework-specific bindings for popular libraries (React, Vue, Angular)

### Improved
- Significant performance optimizations for high-volume logging scenarios
- Reduced memory footprint and faster log processing
- Better handling of concurrent logging operations

### Documentation
- Added enterprise deployment guides
- Docker setup and best practices documentation
- CI/CD integration examples for GitHub Actions, Jenkins, and GitLab
- Framework integration guides and examples

## [1.1.1] - 2025-06-03

### Added
- **Monorepo Support**: Plip Logger now works seamlessly in monorepo setups.
- **Multi-Language Folder Structure Support**: Added support for structured logging setups in languages beyond JavaScript (early-stage support).

## [1.0.0] - 2025-06-01

### Added
- Beautiful colorful logger
- Seven distinct log levels (info, success, warn, error, debug, trace, verbose)
- Smart color detection for terminals
- JSON syntax highlighting for objects
- Fluent API with method chaining
- Full TypeScript support with type definitions
- Environment-aware logging (development/production modes)
- Customizable themes (colors)
- Zero-configuration setup with sensible defaults
- Comprehensive documentation and examples

### Features
- Multiple package manager support (npm, yarn, pnpm, bun)
- Terminal capability auto-detection
- Configurable log level filtering
- Silent mode support
- Development-only logging mode
- Custom color schemes
- Framework integration examples (Express.js)
- Error handling patterns

[Unreleased]: https://github.com/ru-dr/plip/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/ru-dr/plip/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/ru-dr/plip/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/ru-dr/plip/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ru-dr/plip/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ru-dr/plip/releases/tag/v1.0.0
