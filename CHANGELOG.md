# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-29

### Added
- 🚀 RemoteTransport for logging to remote servers with batching and error handling
- 🔄 Transport system with Console, File, Browser, and Remote transports
- ⚙️ Enhanced logging configuration types and logger factory

### Tests
- ✅ Comprehensive tests for formatters, transports, and performance utilities

### Changed
- 🛠️ Organized code structure and improved documentation

## [1.1.0] - 2025-06-02

### Added
- 🏢 Enterprise logger patterns for high-volume production environments
- 🐳 Docker integration examples and containerization support
- 🔄 CI/CD pipeline integration templates and configurations
- 🎨 Enhanced customization options for themes and output formats
- 🔗 Framework-specific bindings for popular libraries (React, Vue, Angular)

### Improved
- ⚡ Significant performance optimizations for high-volume logging scenarios
- 🚀 Reduced memory footprint and faster log processing
- 📊 Better handling of concurrent logging operations

### Documentation
- 📚 Added enterprise deployment guides
- 🐳 Docker setup and best practices documentation
- 🔧 CI/CD integration examples for GitHub Actions, Jenkins, and GitLab
- 🏗️ Framework integration guides and examples

## [1.1.1] - 2025-06-03

### Added
- **Monorepo Support**: Plip Logger now works seamlessly in monorepo setups.
- **Multi-Language Folder Structure Support**: Added support for structured logging setups in languages beyond JavaScript (early-stage support).

## [1.0.0] - 2025-06-01

### Added
- 🫧 Beautiful colorful logger with emoji support
- 🎯 Seven distinct log levels (info, success, warn, error, debug, trace, verbose)
- 🌈 Smart color detection for terminals
- 😊 Automatic emoji support detection
- 🔍 JSON syntax highlighting for objects
- ⚙️ Fluent API with method chaining
- 📦 Full TypeScript support with type definitions
- 🔧 Environment-aware logging (development/production modes)
- 🎨 Customizable themes (colors and emojis)
- 🚀 Zero-configuration setup with sensible defaults
- 📝 Comprehensive documentation and examples

### Features
- Multiple package manager support (npm, yarn, pnpm, bun)
- Terminal capability auto-detection
- Configurable log level filtering
- Silent mode support
- Development-only logging mode
- Custom color schemes
- Framework integration examples (Express.js)
- Error handling patterns

[Unreleased]: https://github.com/ru-dr/plip/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/ru-dr/plip/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/ru-dr/plip/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/ru-dr/plip/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ru-dr/plip/releases/tag/v1.0.0
