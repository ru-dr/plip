# Contributing

Welcome to the Plip Logger community! We're excited to have you contribute to making logging delightful for developers everywhere. This guide will help you get started with contributing to Plip.

## Ways to Contribute

### Bug Reports
Help us identify and fix issues by reporting bugs you encounter.

### Feature Requests  
Share ideas for new features or improvements to existing functionality.

### Documentation
Improve our guides, API references, and examples.

### Code Contributions
Submit bug fixes, feature implementations, or performance improvements.

### Testing
Help test new features, write test cases, or improve test coverage.

### Community Support
Help other users in discussions, issues, and community forums.

## Getting Started

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm/yarn/pnpm/bun**: Any modern package manager
- **Git**: For version control
- **TypeScript**: Basic familiarity helpful

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork https://github.com/ru-dr/plip on GitHub
   # Clone your fork
   git clone https://github.com/YOUR_USERNAME/plip.git
   cd plip
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Run Tests**
   ```bash
   bun test
   ```

4. **Lint and Type-check**
   ```bash
   bun run lint
   bun run typecheck
   ```

5. **Build the Project**
   ```bash
   bun run build
   ```

6. **Start Development**
   ```bash
   bun run dev
   ```

## Project Structure

```
plip/
├── packages/npm/
│   ├── src/              # Source code
│   │   ├── core/         # Logger, config, factory
│   │   ├── transports/   # Console, file, browser, remote transports
│   │   ├── formatters/   # JSON and text formatters
│   │   ├── adapters/     # Framework adapters (React, Next.js)
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── index.ts      # Main entry point
│   └── tests/            # Test files
└── docs/                 # Documentation
```

### Key Files

- `packages/npm/src/core/logger.ts` - Main logger implementation
- `packages/npm/src/core/config.ts` - Configuration handling
- `packages/npm/src/utils/colors.ts` - Color management
- `packages/npm/src/utils/env.ts` - Environment detection
- `packages/npm/tests/` - Test suites
- `packages/npm/eslint.config.mjs` - ESLint 9 flat config
- `.github/workflows/ci.yml` - CI pipeline

## Development Workflow

### 1. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/awesome-new-feature

# Or a bug fix branch
git checkout -b fix/bug-description
```

### 2. Make Changes

- Follow our [coding standards](#coding-standards)
- Write tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Test Your Changes

```bash
# Run all tests
bun test

# Run specific test files
bun test logger.test.ts

# Run tests in watch mode
bun test --watch

# Check test coverage
bun run test:coverage

# Lint and type-check
bun run lint
bun run typecheck
```

### 4. Commit Your Changes

We use [Conventional Commits](https://conventionalcommits.org/) for commit messages:

```bash
# Feature commits
git commit -m "feat: add custom color configuration"

# Bug fix commits  
git commit -m "fix: resolve color detection on Windows"

# Documentation commits
git commit -m "docs: update installation guide"

# Test commits
git commit -m "test: add tests for error handling"
```

### Commit Types

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

### 5. Push and Create PR

```bash
# Push your branch
git push origin feature/awesome-new-feature

# Create a Pull Request on GitHub
```

## Coding Standards

### TypeScript Guidelines

```typescript
// Use TypeScript interfaces
interface LoggerOptions {
  enabledLevels: LogLevel[];
  enableColors: boolean;
}

// Use proper typing
function buildLogger(options: LoggerOptions): Logger {
  // Implementation
}

// Use descriptive variable names
const userAuthenticationLogger = plip.withContext({ scope: 'AUTH' });

// Avoid any types
function badFunction(data: any): any {
  return data;
}
```

### Code Style

Linting is handled by ESLint 9 using the flat config at
`packages/npm/eslint.config.mjs`. Keep the style consistent with the surrounding
code and make sure the code lints and type-checks cleanly:

```bash
# Lint
bun run lint

# Lint and auto-fix what can be fixed
bun run lint:fix

# Type-check only
bun run typecheck

# Build (runs build:esm, build:cjs and build:finalize)
bun run build
```

### Best Practices

#### File Organization
```typescript
// Good file structure
// 1. Imports
import { PlipConfig } from './types';
import { detectColors } from '../utils/colors';

// 2. Types and interfaces
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

// 3. Constants
const DEFAULT_CONFIG: PlipConfig = {
  enabledLevels: ['info', 'success', 'warn', 'error'],
  enableColors: true
};

// 4. Implementation
export class PlipLogger {
  // Implementation
}
```

#### Error Handling
```typescript
// Proper error handling
try {
  const result = riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', error);
  throw new Error('Failed to process', { cause: error });
}
```

#### Testing
```typescript
// Good test structure
import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { createPlip } from '../src/index';

describe('PlipLogger', () => {
  let logger: ReturnType<typeof createPlip>;

  beforeEach(() => {
    logger = createPlip({ enabledLevels: ['info'] });
  });

  describe('info method', () => {
    it('should log info messages with correct format', () => {
      const spy = spyOn(console, 'log');
      logger.info('test message');
      
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('test message')
      );
    });
  });
});
```

## Writing Tests

### Test Structure

We use [Bun's built-in test runner](https://bun.sh/docs/cli/test). The suite
lives in `packages/npm/tests/`, with one file per area: `logger.test.ts`,
`colors.test.ts`, `formatter.test.ts`, `env.test.ts`, `levels-and-errors.test.ts`,
`transport.test.ts`, the per-transport files (`file-transport.test.ts`,
`browser-transport.test.ts`, `remote-transport.test.ts`), `adapters.test.ts`,
`ssr-csr.test.ts`, `integration.test.ts`, `performance.test.ts` and
`regressions.test.ts`. Add new tests to the file that matches the area you
touched, and follow this structure:

```typescript
// packages/npm/tests/logger.test.ts
import { describe, it, expect, spyOn } from 'bun:test';
import { createPlip } from '../src/index';

describe('PlipLogger', () => {
  describe('configuration', () => {
    it('should only log the levels that are enabled', () => {
      const logger = createPlip({ enabledLevels: ['error'] });
      const spy = spyOn(console, 'log');

      logger.info('should not appear');
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });
  });

  describe('log methods', () => {
    it('should log info messages', () => {
      const logger = createPlip({ enabledLevels: ['info'] });
      const spy = spyOn(console, 'log');

      logger.info('test message');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });
  });
});
```

### Test Coverage

Aim for high test coverage, especially for:
- Core logging functionality
- Configuration handling
- Error scenarios
- Platform-specific behavior

```bash
# Check coverage
bun run test:coverage
```

## Documentation

### API Documentation

Update JSDoc comments for all public APIs:

```typescript
/**
 * Creates a new logger instance with custom configuration.
 * 
 * @param config - Configuration options for the logger
 * @returns A new Logger instance
 * 
 * @example
 * ```typescript
 * const logger = createPlip({
 *   enabledLevels: ['debug', 'info', 'warn', 'error'],
 *   enableColors: true
 * });
 * ```
 */
export function createPlip(config?: Partial<PlipConfig>): Logger {
  return new PlipLogger(config);
}
```

### User Documentation

When adding features, update relevant documentation:

- Add examples to appropriate guide pages
- Update API reference if needed
- Include integration examples
- Update the changelog

### Documentation Structure

```markdown
# Feature Name

Brief description of what this feature does.

## Usage

Basic usage example:

```typescript
// Code example
```

## Configuration

Available options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| option1 | string | 'default' | What this option does |

## Examples

### Basic Example
```typescript
// Simple example
```

### Advanced Example
```typescript
// Complex example with real-world usage
```

## Best Practices

- Recommendation 1
- Recommendation 2
```

## Pull Request Guidelines

Every pull request must pass CI before it can be merged.

### Continuous Integration

CI is defined in `.github/workflows/ci.yml` and runs on every push to `main` and
on every pull request. It performs:

- `bun run typecheck`
- `bun run lint`
- `bun test --coverage`
- `bun run build`
- a smoke test that requires the built CJS entrypoint and imports the ESM one
- a documentation build (`bun run docs:build`)

Run `bun run typecheck`, `bun run lint`, `bun test` and `bun run build` locally
before pushing to catch failures early.

### Before Submitting

- [ ] All tests pass
- [ ] `bun run lint` and `bun run typecheck` are clean
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Changelog is updated
- [ ] PR description is complete

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Added tests for new functionality
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or marked as such)
```

### Review Process

1. **Automated Checks**: CI runs typecheck, lint, tests, build and the docs build
2. **Community Review**: Other contributors may review
3. **Maintainer Review**: Core maintainers provide feedback
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to main branch

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

### Changelog

Update `CHANGELOG.md` with your changes:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Bug fix description

### Deprecated
- Deprecated feature description
```

## Community Guidelines

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/):

- Be welcoming and inclusive
- Be respectful and professional
- Focus on constructive feedback
- Help create a positive environment

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Community conversations
- **Pull Requests**: Code review and collaboration
- **Email**: For sensitive matters only

### Getting Help

If you need help contributing:

1. Check existing documentation
2. Search GitHub issues and discussions
3. Ask questions in GitHub discussions
4. Reach out to maintainers if needed

## Recognition

### Contributors

All contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special thanks in major releases

### Types of Recognition

- **Code Contributors**: Bug fixes, features, improvements
- **Documentation Contributors**: Guides, examples, API docs
- **Community Contributors**: Support, discussions, testing
- **Idea Contributors**: Feature requests, design input

## Next Steps

Ready to contribute? Here's what to do:

1. **[Fork the Repository](https://github.com/ru-dr/plip/fork)**
2. **[Clone and Setup](#development-setup)**
3. **[Find an Issue](https://github.com/ru-dr/plip/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)**
4. **[Start Coding](#development-workflow)**

Questions? Feel free to ask in [GitHub Discussions](https://github.com/ru-dr/plip/discussions)!

Thank you for contributing to Plip Logger!
