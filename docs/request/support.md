# Support

Need help with Plip Logger? Plip is a small open source project maintained by
[ru-dr](https://github.com/ru-dr). Support happens in the open, on GitHub. This
page collects the self-service resources, the diagnostics worth running first,
and how to ask a question that can actually be answered.

## Quick Start Resources

### Documentation
- **[Getting Started Guide](/guide/)** - Basic setup and usage
- **[Configuration Reference](/api/configuration)** - Complete configuration options
- **[API Reference](/api/logger)** - Method documentation
- **[Integration Guides](/integration/)** - Framework-specific setup

### Common Solutions
- **[Best Practices](/guide/best-practices)** - Recommended patterns
- **[Compatibility Guide](/guide/compatibility)** - Environment requirements
- **[Errors & Troubleshooting](/references/errors)** - Diagnostic message reference
- **[Environment Variables](/references/environment)** - Configuration options

## Self-Service Support

### Troubleshooting Checklist

Before seeking help, try these common solutions:

#### Installation Issues
```bash
# Clear package cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Update to latest version
npm update @ru-dr/plip
```

#### Configuration Problems
```javascript
// Re-create the logger with an explicit configuration to isolate the problem
const { createPlip } = require('@ru-dr/plip');

const logger = createPlip({
  enabledLevels: ['info', 'warn', 'error', 'success', 'debug'],
  enableColors: true
});

logger.info('Configuration check');
```

#### Performance Issues
```javascript
// Enable every level and time a suspect operation
const { createPlip } = require('@ru-dr/plip');

const logger = createPlip({
  enabledLevels: ['info', 'warn', 'error', 'success', 'debug', 'trace', 'verbose']
});

const timer = logger.startTimer('suspect-operation');
await doWork();
timer.end('suspect-operation finished');
```

#### File Permission Errors
```bash
# Check file permissions
ls -la /path/to/log/file

# Fix permissions
chmod 644 /path/to/log/file
chown user:group /path/to/log/file
```

### Diagnostic Tools

#### Transport Check
```javascript
const { createPlip } = require('@ru-dr/plip');

const logger = createPlip();

// Inspect which transports are currently attached
console.log('Transports:', logger.getTransports().map(t => t.name));
```

#### Transport Failures
```javascript
const { createPlip } = require('@ru-dr/plip');

// Transport errors are reported rather than swallowed - pass `onError`
// to see exactly which transport failed
const logger = createPlip({
  onError: (error, transportName) => {
    console.error(`Transport ${transportName} failed:`, error);
  }
});
```

#### Environment Check
```javascript
const { getRuntimeEnvironment, supportsColor, isDevelopment } = require('@ru-dr/plip');

console.log('Runtime:', getRuntimeEnvironment());
console.log('Colors supported:', supportsColor());
console.log('Development mode:', isDevelopment());
```

#### Debug Information
```javascript
const { getRuntimeEnvironment, supportsColor } = require('@ru-dr/plip');

// Collect the details worth including in a report
const debugInfo = {
  plipVersion: require('@ru-dr/plip/package.json').version,
  node: process.version,
  platform: process.platform,
  runtime: getRuntimeEnvironment(),
  colors: supportsColor(),
  nodeEnv: process.env.NODE_ENV
};

console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
```

## Where to Ask

Everything happens in the [plip repository](https://github.com/ru-dr/plip):

- **[GitHub Discussions](https://github.com/ru-dr/plip/discussions)** - usage
  questions, patterns, ideas and feedback
- **[GitHub Issues](https://github.com/ru-dr/plip/issues)** - reproducible bugs
  and concrete feature requests

This is a single-maintainer project, so replies arrive when time allows. A
well-formed question gets answered much faster than a vague one, and a pull
request is always welcome.

### Asking a Good Question

- Search existing issues and discussions first - your question may already be answered
- Use a clear, specific title that describes the symptom, not just "help"
- Describe what you expected to happen and what actually happened
- Include a minimal, runnable example rather than a large excerpt of your app
- Show what you already tried, including any diagnostics from the section above
- Format code and log output as code blocks so it stays readable

## Bug Reports & Feature Requests

### Bug Reports
For bugs and issues, please use our GitHub Issues:

[**Report Bug →**](/request/bugs)

**Include:**
- Environment details (Plip version, Node.js version, operating system, runtime)
- Reproduction steps, or a minimal reproduction repository
- Expected vs actual behavior
- Error messages, stack traces and relevant log output
- Your Plip configuration

### Feature Requests
For new features and enhancements:

[**Request Feature →**](/request/features)

**Include:**
- Use case description
- Proposed solution
- Alternative solutions considered
- Additional context

## Common Integration Patterns

#### Express.js Setup
```javascript
const express = require('express');
const { plip } = require('@ru-dr/plip');

const app = express();

app.use((req, res, next) => {
  req.logger = plip.withContext({ method: req.method, url: req.url });
  req.logger.info('Request received');
  next();
});
```

#### Error Handling
```javascript
app.use((err, req, res, next) => {
  (req.logger || plip).error('Request failed', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});
```

#### Performance Monitoring
```javascript
app.use((req, res, next) => {
  const timer = plip.startTimer(`${req.method} ${req.url}`);
  res.on('finish', () => timer.end(`${req.method} ${req.url} -> ${res.statusCode}`));
  next();
});
```

## Contributing to Support

Help improve support for everyone:

### Documentation
- Fix typos and unclear explanations
- Add missing examples
- Improve the guides and API reference

### Community
- Answer questions in discussions
- Help newcomers get started
- Share your implementation patterns

### Tools
- Improve diagnostic utilities
- Build integration examples
- Add test coverage

[**Contributing Guide →**](/request/contributing)
