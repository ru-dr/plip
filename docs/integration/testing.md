# Testing Integration

This guide covers integrating Plip Logger into your testing environment, including unit tests, integration tests, and test debugging.

## Installation

::: code-group

```sh [npm]
$ npm install @ru-dr/plip
# Development dependencies for testing
$ npm install --save-dev jest @types/jest vitest
```

```sh [yarn]
$ yarn add @ru-dr/plip
# Development dependencies for testing
$ yarn add --dev jest @types/jest vitest
```

```sh [pnpm]
$ pnpm add @ru-dr/plip
# Development dependencies for testing
$ pnpm add -D jest @types/jest vitest
```

```sh [bun]
$ bun add @ru-dr/plip
# Development dependencies for testing
$ bun add --dev jest @types/jest vitest
```

:::

## Jest Integration

### Basic Setup

Configure Jest to work with Plip Logger:

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/test/**'
  ]
}
```

### Test Setup with Logger

```typescript
// src/test/setup.ts
import { createPlip, type LogLevel } from '@ru-dr/plip'

// Configure logger for testing
const testLogger = createPlip({
  // Only show errors by default (Plip does not read this variable itself)
  enabledLevels: (process.env.TEST_LOG_LEVELS?.split(',') as LogLevel[]) ?? ['error'],
  enableTimestamp: true,
  enableColors: false // Disable colors in test output
})

// Make logger available globally in tests
global.testLogger = testLogger

// Suppress console output during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}
```

### Unit Testing with Mocked Logger

```typescript
// src/services/__tests__/user.service.test.ts
import { UserService } from '../user.service'
import { createPlip, type Logger } from '@ru-dr/plip'

// Mock the logger factory
jest.mock('@ru-dr/plip')
const mockedCreatePlip = createPlip as jest.MockedFunction<typeof createPlip>

describe('UserService', () => {
  let userService: UserService
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    // Create mocked logger instance
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any

    // Make createPlip() return the mock
    mockedCreatePlip.mockReturnValue(mockLogger)

    userService = new UserService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log when user is created successfully', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' }
    
    // Mock the database call
    const mockCreate = jest.fn().mockResolvedValue({ id: 1, ...userData })
    ;(userService as any).userRepository = { create: mockCreate }

    await userService.createUser(userData)

    expect(mockLogger.info).toHaveBeenCalledWith(
      'User created successfully',
      expect.objectContaining({
        userId: 1,
        email: 'test@example.com'
      })
    )
  })

  it('should log error when user creation fails', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' }
    const error = new Error('Database connection failed')
    
    const mockCreate = jest.fn().mockRejectedValue(error)
    ;(userService as any).userRepository = { create: mockCreate }

    await expect(userService.createUser(userData)).rejects.toThrow(error)

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to create user',
      expect.objectContaining({
        email: 'test@example.com',
        error: 'Database connection failed'
      })
    )
  })
})
```

### Integration Testing with Real Logger

```typescript
// src/test/integration/api.test.ts
import request from 'supertest'
import { app } from '../../app'
import { createPlip, type Logger } from '@ru-dr/plip'

describe('API Integration Tests', () => {
  let logger: Logger

  beforeAll(() => {
    // Use real logger for integration tests with debug level
    logger = createPlip({
      enabledLevels: ['debug', 'info', 'success', 'warn', 'error'],
      enableTimestamp: true,
      enableColors: false
    })
  })

  it('should handle user creation with proper logging', async () => {
    const userData = {
      email: 'integration@test.com',
      name: 'Integration Test'
    }

    logger.info('Starting user creation integration test')

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.email).toBe(userData.email)

    logger.info('User creation test completed successfully', {
      userId: response.body.id
    })
  })
})
```

## Vitest Integration

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
})
```

### Test Utilities

```typescript
// src/test/utils.ts
import { createPlip, type Logger } from '@ru-dr/plip'

export class TestLogger {
  private logs: Array<{
    level: string
    message: string
    data?: any
    timestamp: Date
  }> = []

  private logger: Logger

  constructor() {
    this.logger = createPlip({
      enabledLevels: ['debug', 'info', 'success', 'warn', 'error'],
      enableTimestamp: true,
      enableColors: false
    })

    // Override logger methods to capture logs
    const originalMethods = ['info', 'error', 'warn', 'debug']
    
    originalMethods.forEach(method => {
      const original = this.logger[method].bind(this.logger)
      this.logger[method] = (message: string, data?: any) => {
        this.logs.push({
          level: method,
          message,
          data,
          timestamp: new Date()
        })
        return original(message, data)
      }
    })
  }

  getLogger(): Logger {
    return this.logger
  }

  getLogs(): typeof this.logs {
    return [...this.logs]
  }

  getLogsByLevel(level: string): typeof this.logs {
    return this.logs.filter(log => log.level === level)
  }

  findLog(predicate: (log: typeof this.logs[0]) => boolean): typeof this.logs[0] | undefined {
    return this.logs.find(predicate)
  }

  clear(): void {
    this.logs = []
  }

  assertLogExists(level: string, messagePattern: string | RegExp): void {
    const log = this.logs.find(log => {
      if (log.level !== level) return false
      
      if (typeof messagePattern === 'string') {
        return log.message.includes(messagePattern)
      } else {
        return messagePattern.test(log.message)
      }
    })

    if (!log) {
      throw new Error(
        `Expected log with level "${level}" and message matching "${messagePattern}" not found. ` +
        `Available logs: ${JSON.stringify(this.logs, null, 2)}`
      )
    }
  }
}

export function createTestLogger(): TestLogger {
  return new TestLogger()
}
```

### Using Test Logger

```typescript
// src/services/__tests__/user.service.vitest.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { UserService } from '../user.service'
import { createTestLogger } from '../../test/utils'

describe('UserService', () => {
  let userService: UserService
  let testLogger: TestLogger

  beforeEach(() => {
    testLogger = createTestLogger()
    userService = new UserService(testLogger.getLogger())
  })

  it('should log user creation process', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' }

    await userService.createUser(userData)

    // Assert specific logs were created
    testLogger.assertLogExists('info', 'Creating user')
    testLogger.assertLogExists('info', 'User created successfully')

    // Check log data
    const creationLog = testLogger.findLog(log => 
      log.message.includes('User created successfully')
    )
    
    expect(creationLog?.data).toMatchObject({
      email: 'test@example.com'
    })
  })

  it('should log errors with proper context', async () => {
    const userData = { email: 'invalid-email', name: 'Test' }

    await expect(userService.createUser(userData)).rejects.toThrow()

    testLogger.assertLogExists('error', 'Failed to create user')
    
    const errorLog = testLogger.getLogsByLevel('error')[0]
    expect(errorLog.data).toHaveProperty('error')
    expect(errorLog.data).toHaveProperty('email', 'invalid-email')
  })
})
```

## Test Environment Configuration

### Environment-Based Logger Setup

```typescript
// src/config/test-logger.config.ts
import { createPlip, type Logger, type LogLevel } from '@ru-dr/plip'

export function createTestLogger(options?: {
  levels?: LogLevel[]
  enableConsole?: boolean
  captureOutput?: boolean
}): Logger {
  const {
    levels = (process.env.TEST_LOG_LEVELS?.split(',') as LogLevel[]) ?? ['error'],
    enableConsole = process.env.ENABLE_TEST_LOGS === 'true',
    captureOutput = false
  } = options || {}

  const logger = createPlip({
    enabledLevels: levels,
    enableTimestamp: true,
    enableColors: false
  })

  if (!enableConsole && !captureOutput) {
    // Suppress output in tests
    logger.info = () => {}
    logger.warn = () => {}
    logger.debug = () => {}
    // Keep error logging for debugging test failures
  }

  return logger
}

// Usage in tests
export const testLogger = createTestLogger()
```

### Database Testing with Logging

```typescript
// src/test/database.test.ts
import { createPlip, type Logger } from '@ru-dr/plip'
import { setupTestDatabase, teardownTestDatabase } from './db-setup'

describe('Database Operations', () => {
  let logger: Logger

  beforeAll(async () => {
    logger = createPlip({
      enabledLevels: ['debug', 'info', 'success', 'warn', 'error'],
      enableTimestamp: true
    })

    logger.info('Setting up test database')
    await setupTestDatabase()
  })

  afterAll(async () => {
    logger.info('Tearing down test database')
    await teardownTestDatabase()
  })

  it('should log database queries during testing', async () => {
    logger.debug('Testing database query logging')

    // Your database test logic here
    const result = await someQueryFunction()

    expect(result).toBeDefined()
    logger.info('Database query test completed successfully')
  })
})
```

## Performance Testing with Logging

### Load Testing with Metrics

```typescript
// src/test/performance/load.test.ts
import { createPlip, type Logger } from '@ru-dr/plip'

class PerformanceLogger {
  private logger: Logger
  private metrics: {
    requestCount: number
    totalDuration: number
    errors: number
    startTime: number
  }

  constructor() {
    this.logger = createPlip({
      enabledLevels: ['info', 'success', 'warn', 'error'],
      enableTimestamp: true
    })

    this.metrics = {
      requestCount: 0,
      totalDuration: 0,
      errors: 0,
      startTime: Date.now()
    }
  }

  async measureOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = Date.now()
    this.metrics.requestCount++

    try {
      const result = await operation()
      const duration = Date.now() - start
      this.metrics.totalDuration += duration

      this.logger.debug(`Operation ${name} completed`, {
        duration: `${duration}ms`,
        requestNumber: this.metrics.requestCount
      })

      return result
    } catch (error) {
      this.metrics.errors++
      const duration = Date.now() - start

      this.logger.error(`Operation ${name} failed`, {
        duration: `${duration}ms`,
        requestNumber: this.metrics.requestCount,
        error: error.message
      })

      throw error
    }
  }

  logSummary(): void {
    const totalTime = Date.now() - this.metrics.startTime
    const avgDuration = this.metrics.totalDuration / this.metrics.requestCount
    const throughput = this.metrics.requestCount / (totalTime / 1000)
    const errorRate = (this.metrics.errors / this.metrics.requestCount) * 100

    this.logger.info('Performance Test Summary', {
      totalRequests: this.metrics.requestCount,
      totalTime: `${totalTime}ms`,
      averageDuration: `${avgDuration.toFixed(2)}ms`,
      throughput: `${throughput.toFixed(2)} req/s`,
      errorRate: `${errorRate.toFixed(2)}%`,
      errors: this.metrics.errors
    })
  }
}

describe('Performance Tests', () => {
  it('should measure API performance', async () => {
    const perfLogger = new PerformanceLogger()
    const iterations = 100

    for (let i = 0; i < iterations; i++) {
      await perfLogger.measureOperation('api-call', async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        
        // Randomly simulate errors
        if (Math.random() < 0.05) {
          throw new Error('Simulated error')
        }
      })
    }

    perfLogger.logSummary()
  })
})
```

## Debugging Test Failures

### Enhanced Error Logging

```typescript
// src/test/debug-helpers.ts
import { createPlip, type Logger } from '@ru-dr/plip'

export class TestDebugger {
  private logger: Logger
  private testContext: {
    testName?: string
    startTime: number
    steps: Array<{ step: string; timestamp: number; data?: any }>
  }

  constructor() {
    this.logger = createPlip({
      enabledLevels: ['debug', 'info', 'success', 'warn', 'error'],
      enableTimestamp: true,
      enableColors: true
    })

    this.testContext = {
      startTime: Date.now(),
      steps: []
    }
  }

  startTest(testName: string): void {
    this.testContext.testName = testName
    this.testContext.startTime = Date.now()
    this.testContext.steps = []

    this.logger.info(`Starting test: ${testName}`)
  }

  step(stepName: string, data?: any): void {
    const step = {
      step: stepName,
      timestamp: Date.now(),
      data
    }

    this.testContext.steps.push(step)

    this.logger.debug(`Test step: ${stepName}`, data)
  }

  endTest(success: boolean): void {
    const duration = Date.now() - this.testContext.startTime

    if (success) {
      this.logger.info(`Test passed: ${this.testContext.testName}`, {
        duration: `${duration}ms`,
        steps: this.testContext.steps.length
      })
    } else {
      this.logger.error(`Test failed: ${this.testContext.testName}`, {
        duration: `${duration}ms`,
        steps: this.testContext.steps,
        context: this.getDebugContext()
      })
    }
  }

  private getDebugContext(): any {
    return {
      testName: this.testContext.testName,
      totalDuration: Date.now() - this.testContext.startTime,
      stepCount: this.testContext.steps.length,
      steps: this.testContext.steps.map(step => ({
        ...step,
        relativeTime: step.timestamp - this.testContext.startTime
      }))
    }
  }
}

// Usage in tests
export function useTestDebugger() {
  return new TestDebugger()
}
```

### Using Test Debugger

```typescript
// src/api/__tests__/complex-workflow.test.ts
import { useTestDebugger } from '../../test/debug-helpers'

describe('Complex Workflow', () => {
  it('should handle multi-step user registration', async () => {
    const debugger = useTestDebugger()
    
    try {
      debugger.startTest('Multi-step user registration')

      debugger.step('Validate input data', { email: 'test@example.com' })
      const validationResult = await validateUserData({ email: 'test@example.com' })

      debugger.step('Create user account', { validationPassed: validationResult.isValid })
      const user = await createUserAccount(validationResult.data)

      debugger.step('Send welcome email', { userId: user.id })
      await sendWelcomeEmail(user.email)

      debugger.step('Log user activity', { userId: user.id })
      await logUserActivity(user.id, 'REGISTRATION')

      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')

      debugger.endTest(true)
    } catch (error) {
      debugger.endTest(false)
      throw error
    }
  })
})
```

## Continuous Integration

### CI Logger Configuration

```typescript
// src/config/ci-logger.ts
import { createPlip, type Logger } from '@ru-dr/plip'

export function createCILogger(): Logger {
  // Detect CI environment
  const isCI = process.env.CI === 'true' || 
               process.env.GITHUB_ACTIONS === 'true' ||
               process.env.TRAVIS === 'true'

  return createPlip({
    enabledLevels: isCI
      ? ['error']
      : ['debug', 'info', 'success', 'warn', 'error'],
    enableTimestamp: true,
    enableColors: !isCI, // Disable colors in CI
    enableStructuredOutput: isCI // One JSON object per line in CI for easier parsing
  })
}
```

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with detailed logging
        run: npm test
        env:
          TEST_LOG_LEVELS: info,success,warn,error
          ENABLE_TEST_LOGS: true
          CI: true
```

## Best Practices

1. **Selective Logging**: Use appropriate log levels for different test types
2. **Mock vs Real**: Mock loggers for unit tests, use real loggers for integration tests
3. **Performance Monitoring**: Track test execution times and resource usage
4. **Error Context**: Include sufficient context when logging test failures
5. **CI/CD Integration**: Configure logging appropriately for CI environments
6. **Test Isolation**: Ensure logging doesn't interfere with test isolation
7. **Debug Information**: Capture debug information for failed tests
8. **Log Cleanup**: Clear logs between tests to avoid interference

## Troubleshooting

### Common Issues

**Tests failing due to logger configuration:**
- Check log level settings in test environment
- Ensure logger is properly mocked in unit tests
- Verify test setup files are loaded correctly

**Performance impact from logging:**
- Use error-level logging in performance tests
- Consider disabling logging for benchmark tests
- Monitor test execution time with and without logging

**Log output cluttering test results:**
- Suppress console output unless explicitly enabled
- Use structured logging for easier parsing
- Configure CI environments to handle log output appropriately

This comprehensive testing integration guide ensures you can effectively use Plip Logger throughout your testing strategy while maintaining clean, readable test output and debugging capabilities.
