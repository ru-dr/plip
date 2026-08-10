# Feature Requests

Have an idea for improving Plip Logger? We'd love to hear from you! This guide explains how to request new features and contribute ideas to make Plip even better.

## Before Submitting a Feature Request

### Check Existing Requests

Before creating a new feature request:

1. **Search existing issues**: Check [GitHub Issues](https://github.com/ru-dr/plip/issues) for similar requests
2. **Review discussions**: Browse [GitHub Discussions](https://github.com/ru-dr/plip/discussions) for related topics
3. **Check the roadmap**: See what's already planned in our [project roadmap](https://github.com/ru-dr/plip/projects)

### Consider the Scope

Plip Logger aims to be:
- **Focused**: Excellent at logging, not everything
- **Lightweight**: No runtime dependencies
- **Beautiful**: Emphasis on visual appeal and developer experience
- **Flexible**: Configurable but with sensible defaults

## How to Submit a Feature Request

### 1. Create a GitHub Issue

Visit our [GitHub Issues page](https://github.com/ru-dr/plip/issues/new?template=feature_request.md) and use the feature request template.

### 2. Provide Complete Information

Include these details in your request:

#### Problem Statement
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]
```

#### Proposed Solution
```markdown
**Describe the solution you'd like**
A clear description of what you want to happen.
```

#### Alternatives Considered
```markdown
**Describe alternatives you've considered**
Other approaches or workarounds you've tried.
```

#### Use Cases
```markdown
**Additional context**
- Who would benefit from this feature?
- How would it be used?
- What's the expected impact?
```

## Types of Feature Requests

### Visual & UX Improvements

Enhancements to the visual output and developer experience:

- New color themes
- Color scheme improvements
- Output formatting options
- Terminal compatibility improvements

**Example:**
```markdown
**Feature**: Dark mode optimized colors
**Problem**: Current colors don't look great on light terminals
**Solution**: Add a light/dark mode detection and adjust colors accordingly
```

### Configuration & Customization

New configuration options or customization capabilities:

- Additional configuration properties
- New output formats
- Custom formatter support
- Environment-specific settings

**Example:**
```markdown
**Feature**: Custom color configuration
**Problem**: Some teams prefer different colors for log levels
**Solution**: Allow configuration of custom color mappings
```

### Integration & Compatibility

Better integration with frameworks, tools, and platforms:

- New framework integrations
- CI/CD platform support
- Log aggregation service compatibility
- IDE integration improvements

**Example:**
```markdown
**Feature**: Winston logger adapter
**Problem**: Teams using Winston want to migrate gradually
**Solution**: Create an adapter that allows Winston loggers to use Plip formatting
```

### Performance & Features

Core functionality improvements and new features:

- Performance optimizations
- New log levels or methods
- Advanced filtering capabilities
- Structured logging enhancements

**Example:**
```markdown
**Feature**: Log sampling for high-volume applications
**Problem**: Too many logs in production can impact performance
**Solution**: Add configurable sampling rates for different log levels
```

## Feature Request Template

Use this template when submitting feature requests:

```markdown
## Feature Request

### Summary
Brief one-line description of the feature.

### Problem
What problem does this feature solve? Why is it needed?

### Proposed Solution
How should this feature work? Include code examples if applicable.

### Benefits
- Who benefits from this feature?
- What's the expected impact?
- How does it align with Plip's goals?

### Implementation Ideas
- Any thoughts on how this could be implemented?
- Are there existing libraries or approaches to consider?
- What's the estimated complexity?

### Alternatives
- What alternatives have you considered?
- Why is this approach preferred?

### Additional Context
- Screenshots, mockups, or examples
- Links to related issues or discussions
- Any other relevant information
```

## Popular Feature Ideas

### Current Community Requests

These are some popular feature ideas from the community. **None of the APIs below exist yet** — they are proposed designs, shown here to illustrate the requests.

#### 1. Log Aggregation Integration
```typescript
// PROPOSED API — not implemented. Today, use addTransport() with the built-in
// ConsoleTransport / FileTransport / RemoteTransport instead.
plip.configure({
  outputs: [
    'console',
    { type: 'datadog', apiKey: process.env.DATADOG_API_KEY },
    { type: 'cloudwatch', region: 'us-east-1' }
  ]
});
```

#### 2. Custom Log Levels
```typescript
// PROPOSED API — not implemented. Plip's levels are a fixed set today:
// info, warn, error, success, debug, trace, verbose.
plip.addLevel('security', { 
  priority: 15, 
  color: 'red' 
});

plip.security("Suspicious activity detected", { userId, ip });
```

#### 3. Log Filtering and Sampling
```typescript
// PROPOSED API — not implemented. Today, level filtering is done with
// `enabledLevels` / `.levels(...)`.
plip.configure({
  filters: [
    { level: 'debug', sample: 0.1 }, // 10% of debug logs
    { pattern: '/health', ignore: true }, // Ignore health checks
    { userId: 'test-user', ignore: true } // Ignore test users
  ]
});
```

#### 4. Structured Metadata
```typescript
// This one already works today via withContext()
plip.withContext({
  service: 'user-api',
  version: '1.2.0',
  environment: 'production'
}).info("User created", { userId: 123 });
```

### How to Contribute Ideas

#### Start a Discussion

For broader ideas or concepts, consider starting a [GitHub Discussion](https://github.com/ru-dr/plip/discussions):

- Share your vision for Plip's future
- Discuss complex feature ideas
- Get community feedback before formal requests
- Collaborate on implementation approaches

#### Join Our Community

Connect with other Plip users and contributors:

- [GitHub Discussions](https://github.com/ru-dr/plip/discussions)
- [GitHub Issues](https://github.com/ru-dr/plip/issues)
- [Contributing Guide](https://github.com/ru-dr/plip/blob/main/CONTRIBUTING.md)

## Implementation Process

### How Features Are Evaluated

We evaluate feature requests based on:

1. **Alignment with Plip's goals**: Does it enhance the logging experience?
2. **Community demand**: How many users would benefit?
3. **Implementation complexity**: What's the development effort required?
4. **Maintenance burden**: Long-term maintenance considerations
5. **Performance impact**: Effects on Plip's lightweight nature

### Feature Development Process

1. **Community Discussion**: Gather feedback and refine the idea
2. **Design Review**: Technical design and API considerations
3. **Implementation**: Development and testing
4. **Community Testing**: Beta testing with interested users
5. **Release**: Include in the next appropriate version

### Timeline Expectations

- **Small features**: 1-2 releases (1-2 months)
- **Medium features**: 2-4 releases (2-4 months)
- **Large features**: Multiple releases (3-6 months)

*Timelines depend on complexity, community involvement, and maintainer availability.*

## Examples of Successful Requests

### Recently Implemented Features

#### 1. Per-Module Context Support
**Original Request**: "Allow custom prefixes for different modules"
**Implementation**:
```typescript
const dbLogger = plip.withContext({ scope: 'DB' });
const apiLogger = plip.withContext({ scope: 'API' });
```

#### 2. Environment-Aware Configuration
**Original Request**: "Automatically adjust settings based on NODE_ENV"
**Implementation**:
```typescript
// configure() returns a new logger; it does not mutate the original
const logger = plip.configure({
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'success', 'warn', 'error']
    : ['debug', 'info', 'success', 'warn', 'error', 'trace', 'verbose']
});
```

#### 3. Error Object Enhancement
**Original Request**: "Better handling of Error objects and stack traces"
**Implementation**: Automatic error parsing and stack trace formatting

## Tips for Great Feature Requests

### Do This

- **Be specific**: Clear, detailed descriptions
- **Provide context**: Real-world use cases
- **Include examples**: Code snippets when applicable
- **Consider others**: How would this benefit the community?
- **Stay focused**: One feature per request

### Avoid This

- **Vague requests**: "Make it better" isn't actionable
- **Multiple features**: Keep requests focused
- **Demanding tone**: We're all volunteers here
- **Duplicate requests**: Check existing issues first
- **Implementation details**: Focus on the problem, not the solution

## Next Steps

Ready to contribute? Here's how to get started:

1. **[Submit a Feature Request](https://github.com/ru-dr/plip/issues/new?template=feature_request.md)**
2. **[Join the Discussion](https://github.com/ru-dr/plip/discussions)**
3. **[Contributing Guide](/request/contributing)**
4. **[Get Support](/request/support)**

Your ideas help make Plip better for everyone!
