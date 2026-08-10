# Custom Loggers

Learn how to create powerful, context-aware custom logger instances for different parts of your application. This guide covers everything from basic custom loggers to advanced enterprise patterns.

::: tip Why Custom Loggers?
Custom loggers help you organize logs by service, add automatic context, and maintain consistency across your application. They're especially valuable in microservices, APIs, and production environments.
:::

## Table of Contents

- [Quick Start](#quick-start) - Get started in 2 minutes
- [Service-Specific Loggers](#service-specific-loggers) - Database, API, Auth examples
- [Built-in Context Support](#built-in-context-support) - Powerful `withContext()` method
- [Advanced Patterns](#advanced-patterns) - Factory, metrics, conditional logging
- [Real-World Examples](#real-world-examples) - E-commerce, microservices, jobs
- [Enterprise Patterns](#enterprise-patterns) - Registry, correlation, multi-tenant
- [Performance Considerations](#performance-considerations) - Optimization techniques
- [Best Practices](#best-practices) - Professional guidelines

## Quick Start

### Creating Your First Custom Logger

```typescript
import { createPlip } from '@ru-dr/plip';

const customLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});

customLogger.info("Hello from my custom logger!");
// Output: [INFO] Hello from my custom logger!
```

::: code-group

```typescript [Basic Usage]
// Simple custom logger
const apiLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
});

apiLogger.info("API server started", { port: 3000 });
```

```typescript [With Context]
// Logger with automatic context
const dbLogger = createPlip({
  enableColors: true,
  enabledLevels: ['debug', 'info', 'warn', 'error']
}).withContext({ service: 'database', version: '1.0' });

dbLogger.info("Connection established");
// Output: [INFO] Connection established {"service":"database","version":"1.0"}
```

```typescript [Production Ready]
// Environment-aware logger
const prodLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
}).withContext({ 
  service: 'user-api',
  environment: 'production',
  version: process.env.APP_VERSION 
});
```

:::

### Why Custom Loggers?

Custom loggers provide:
- **Focused logging** - Different log levels for different services
- **Automatic context** - Service names, request IDs, user info
- **Tailored configuration** - Production vs development settings
- **Better debugging** - Trace issues by service or feature
- **Maintainability** - Centralized logging configuration
- **Performance** - Only log what you need, when you need it

## Service-Specific Loggers

Create specialized loggers for different parts of your application:

### Database Operations

```typescript
const dbLogger = createPlip({
  enableColors: true,
  enabledLevels: ['debug', 'info', 'warn', 'error']
}).withContext({ service: 'database' });

// Connection management
dbLogger.info("Database connected", { host: 'localhost', db: 'myapp' });
dbLogger.warn("Connection pool getting full", { active: 18, max: 20 });

// Query performance
dbLogger.debug("Query executed", { 
  sql: "SELECT * FROM users WHERE active = ?", 
  duration: "23ms",
  rows: 1250 
});

// Error handling
dbLogger.error("Query failed", { 
  error: "connection_timeout",
  query: "UPDATE users SET last_login = NOW()",
  retryAttempt: 3
});
```

### API Request Handling

```typescript
const apiLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
}).withContext({ service: 'api', version: 'v1' });

// Request logging
apiLogger.info("Request received", {
  method: 'POST',
  endpoint: '/api/users',
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.100'
});

// Response logging
apiLogger.info("Response sent", {
  status: 201,
  responseTime: '45ms',
  contentLength: 1024
});

// Rate limiting
apiLogger.warn("Rate limit triggered", {
  ip: '192.168.1.100',
  endpoint: '/api/users',
  attempts: 100,
  window: '1h'
});
```

### Authentication & Security

```typescript
const authLogger = createPlip({
  enableColors: true,
  enabledLevels: ['info', 'warn', 'error']
}).withContext({ service: 'auth', component: 'security' });

// Successful authentication
authLogger.info("User authenticated", {
  userId: 'user_12345',
  method: 'oauth2',
  provider: 'google',
  sessionId: 'sess_abc123'
});

// Security events
authLogger.warn("Multiple failed login attempts", {
  userId: 'user_67890',
  attempts: 5,
  timeWindow: '5min',
  lastAttempt: '2025-06-01T10:30:00Z'
});

authLogger.error("Suspicious activity detected", {
  userId: 'user_suspicious',
  activity: 'multiple_rapid_requests',
  flagged: true,
  requiresReview: true
});

// Critical security
authLogger.error("Potential security breach", {
  type: 'unauthorized_admin_access',
  sourceIp: '10.0.0.1',
  targetResource: '/admin/users',
  alertSent: true
});
```

## Advanced Patterns

### Logger Factory with Dynamic Configuration

Create a sophisticated factory that adapts to different environments and requirements:

```typescript
interface LoggerConfig {
  service: string;
  version: string;
  environment: 'development' | 'staging' | 'production' | 'test';
  enableDebug?: boolean;
  enableMetrics?: boolean;
  contextData?: Record<string, any>;
}

class LoggerFactory {
  static createServiceLogger(config: LoggerConfig) {
    const { 
      service, 
      version, 
      environment, 
      enableDebug = false, 
      enableMetrics = false,
      contextData = {}
    } = config;
    
    const isProd = environment === 'production';
    const isTest = environment === 'test';
    
    // Base configuration
    const baseConfig = {
      enableColors: !isTest,
      enabledLevels: [
        ...(enableDebug || environment === 'development' ? ['verbose', 'debug'] : []),
        'info',
        'success',
        'warn',
        'error'
      ] as LogLevel[]
    };
    
    // Base context
    const baseContext = {
      service,
      version,
      environment,
      pid: process.pid,
      hostname: require('os').hostname(),
      timestamp: new Date().toISOString(),
      ...contextData
    };
    
    // Add production-specific context
    if (isProd) {
      baseContext.region = process.env.AWS_REGION;
      baseContext.instanceId = process.env.EC2_INSTANCE_ID;
      baseContext.cluster = process.env.CLUSTER_NAME;
    }
    
    // Add development-specific context
    if (environment === 'development') {
      baseContext.developer = process.env.USER;
      baseContext.gitBranch = process.env.GIT_BRANCH;
      baseContext.gitCommit = process.env.GIT_COMMIT?.slice(0, 7);
    }
    
    const logger = createPlip(baseConfig).withContext(baseContext);
    
    // Add metrics if enabled
    if (enableMetrics) {
      return new MetricsLogger(logger, service);
    }
    
    return logger;
  }
}

// Usage examples
const userService = LoggerFactory.createServiceLogger({
  service: 'user-service',
  version: '2.1.0',
  environment: 'production',
  enableMetrics: true,
  contextData: {
    database: 'postgresql',
    cacheLayer: 'redis'
  }
});

const authService = LoggerFactory.createServiceLogger({
  service: 'auth-service',
  version: '1.5.2',
  environment: 'development',
  enableDebug: true,
  contextData: {
    oauthProvider: 'auth0',
    jwtVersion: 'v2'
  }
});
```

### Metrics Integration Logger

```typescript
class MetricsLogger {
  private logger: any;
  private serviceName: string;
  private metrics: Map<string, number> = new Map();
  
  constructor(logger: any, serviceName: string) {
    this.logger = logger;
    this.serviceName = serviceName;
    
    // Flush metrics every 30 seconds
    setInterval(() => this.flushMetrics(), 30000);
  }
  
  info(message: string, data?: any) {
    this.incrementMetric('log.info');
    return this.logger.info(message, data);
  }
  
  warn(message: string, data?: any) {
    this.incrementMetric('log.warn');
    return this.logger.warn(message, data);
  }
  
  error(message: string, data?: any) {
    this.incrementMetric('log.error');
    return this.logger.error(message, data);
  }
  
  success(message: string, data?: any) {
    this.incrementMetric('log.success');
    return this.logger.success(message, data);
  }
  
  // Performance logging with automatic metrics
  timeOperation<T>(operationName: string, operation: () => T): T {
    const startTime = Date.now();
    const operationLogger = this.logger.withContext({ 
      operation: operationName,
      operationId: crypto.randomUUID()
    });
    
    operationLogger.debug(`Starting operation: ${operationName}`);
    
    try {
      const result = operation();
      const duration = Date.now() - startTime;
      
      this.recordOperationMetric(operationName, duration, 'success');
      operationLogger.success(`Operation completed: ${operationName}`, { 
        duration: `${duration}ms` 
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordOperationMetric(operationName, duration, 'error');
      operationLogger.error(`Operation failed: ${operationName}`, { 
        duration: `${duration}ms`,
        error: error.message 
      });
      
      throw error;
    }
  }
  
  private incrementMetric(metric: string) {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + 1);
  }
  
  private recordOperationMetric(operation: string, duration: number, status: string) {
    this.incrementMetric(`operation.${operation}.${status}`);
    this.incrementMetric(`operation.${operation}.duration`);
    // In real implementation, you'd send to metrics service
  }
  
  private flushMetrics() {
    if (this.metrics.size > 0) {
      this.logger.info('Metrics report', {
        service: this.serviceName,
        metrics: Object.fromEntries(this.metrics.entries()),
        reportTime: new Date().toISOString()
      });
      this.metrics.clear();
    }
  }
}

// Usage
const metricsLogger = new MetricsLogger(
  plip.withContext({ service: 'payment-processor' }),
  'payment-processor'
);

// Automatic timing and metrics
const result = metricsLogger.timeOperation('process-payment', () => {
  // Payment processing logic
  return processPayment(paymentData);
});
```

### Conditional Logging Logger

```typescript
class ConditionalLogger {
  private baseLogger: any;
  private conditions: Map<string, (data?: any) => boolean> = new Map();
  
  constructor(baseLogger: any) {
    this.baseLogger = baseLogger;
  }
  
  // Add conditions for when to log
  addCondition(name: string, condition: (data?: any) => boolean) {
    this.conditions.set(name, condition);
    return this;
  }
  
  // Only log if all conditions pass
  conditionalLog(level: string, message: string, data?: any) {
    const shouldLog = Array.from(this.conditions.values())
      .every(condition => condition(data));
    
    if (shouldLog) {
      this.baseLogger[level](message, data);
    }
  }
  
  info(message: string, data?: any) {
    this.conditionalLog('info', message, data);
  }
  
  warn(message: string, data?: any) {
    this.conditionalLog('warn', message, data);
  }
  
  error(message: string, data?: any) {
    this.conditionalLog('error', message, data);
  }
}

// Usage examples
const conditionalLogger = new ConditionalLogger(
  plip.withContext({ service: 'notification-service' })
)
  .addCondition('not-test-user', (data) => 
    !data?.userId?.startsWith('test_')
  )
  .addCondition('business-hours', () => {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17;
  })
  .addCondition('not-spam', (data) =>
    !data?.message?.toLowerCase().includes('spam')
  );

// This will only log if it's business hours, not a test user, and not spam
conditionalLogger.info('Notification sent', {
  userId: 'user_12345',
  message: 'Your order has shipped!'
});
```

## Real-World Examples

### E-commerce Application

```typescript
// Product catalog service
const catalogLogger = LoggerFactory.createServiceLogger({
  service: 'product-catalog',
  version: '3.2.1',
  environment: process.env.NODE_ENV as any,
  enableDebug: true,
  contextData: {
    database: 'mongodb',
    searchEngine: 'elasticsearch',
    cacheLayer: 'redis'
  }
});

// Shopping cart operations
const cartLogger = catalogLogger.withContext({
  component: 'shopping-cart',
  operation: 'cart-management'
});

async function addToCart(userId: string, productId: string, quantity: number) {
  const operationLogger = cartLogger.withContext({
    userId,
    productId,
    quantity,
    sessionId: generateSessionId()
  });
  
  operationLogger.info("Adding item to cart");
  
  try {
    // Check product availability
    operationLogger.debug("Checking product availability");
    const product = await productService.getProduct(productId);
    
    if (product.stock < quantity) {
      operationLogger.warn("Insufficient stock", {
        requested: quantity,
        available: product.stock
      });
      throw new Error('Insufficient stock');
    }
    
    // Add to cart
    operationLogger.debug("Adding to user cart");
    const cartItem = await cartService.addItem(userId, productId, quantity);
    
    operationLogger.success("Item added to cart", {
      cartItemId: cartItem.id,
      cartTotal: cartItem.cart.total,
      itemCount: cartItem.cart.items.length
    });
    
    return cartItem;
    
  } catch (error) {
    operationLogger.error("Failed to add item to cart", {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

### Microservices Communication

```typescript
// API Gateway logger
const gatewayLogger = LoggerFactory.createServiceLogger({
  service: 'api-gateway',
  version: '1.0.0',
  environment: 'production',
  enableMetrics: true
});

// Request routing with detailed logging
async function routeRequest(req: Request, res: Response) {
  const requestLogger = gatewayLogger.withContext({
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  requestLogger.info("Request received at gateway");
  
  // Determine target service
  const targetService = determineTargetService(req.path);
  const serviceLogger = requestLogger.withContext({
    targetService: targetService.name,
    targetUrl: targetService.url,
    loadBalancer: targetService.loadBalancer
  });
  
  serviceLogger.info("Routing to service", {
    routingRule: targetService.rule,
    serviceHealth: targetService.health
  });
  
  try {
    // Forward request
    const startTime = Date.now();
    const response = await forwardRequest(targetService.url, req);
    const duration = Date.now() - startTime;
    
    serviceLogger.success("Request forwarded successfully", {
      statusCode: response.status,
      responseTime: `${duration}ms`,
      contentLength: response.headers['content-length']
    });
    
    // Send response
    res.status(response.status).send(response.data);
    
  } catch (error) {
    serviceLogger.error("Request forwarding failed", {
      error: error.message,
      errorCode: error.code,
      retryAttempt: error.retryAttempt || 0
    });
    
    res.status(502).json({
      error: 'Service temporarily unavailable',
      requestId: requestLogger.context.requestId
    });
  }
}
```

### Background Job Processing

```typescript
// Job processing service
const jobLogger = LoggerFactory.createServiceLogger({
  service: 'job-processor',
  version: '2.0.0',
  environment: 'production',
  enableDebug: false,
  enableMetrics: true,
  contextData: {
    queueProvider: 'rabbitmq',
    workerPool: 'primary'
  }
});

class JobProcessor {
  async processJob(job: Job) {
    const jobLogger = jobLogger.withContext({
      jobId: job.id,
      jobType: job.type,
      priority: job.priority,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      queuedAt: job.queuedAt,
      worker: process.pid
    });
    
    jobLogger.info("Job processing started");
    
    const startTime = Date.now();
    
    try {
      // Job processing logic
      await this.executeJob(job, jobLogger);
      
      const duration = Date.now() - startTime;
      jobLogger.success("Job completed successfully", {
        duration: `${duration}ms`,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const isRetryable = this.isRetryableError(error);
      
      jobLogger.error("Job processing failed", {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
        isRetryable,
        nextRetryAt: isRetryable ? this.calculateNextRetry(job) : null
      });
      
      if (job.attempts >= job.maxAttempts) {
        jobLogger.error("Job exceeded max attempts, moving to dead letter queue", {
          finalAttempt: job.attempts,
          maxAttempts: job.maxAttempts
        });
      }
      
      throw error;
    }
  }
  
  private async executeJob(job: Job, logger: any) {
    const executionLogger = logger.withContext({
      execution: 'job-handler',
      handler: job.type
    });
    
    switch (job.type) {
      case 'send-email':
        return this.processEmailJob(job, executionLogger);
      case 'generate-report':
        return this.processReportJob(job, executionLogger);
      case 'process-payment':
        return this.processPaymentJob(job, executionLogger);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }
  
  private async processEmailJob(job: Job, logger: any) {
    logger.debug("Processing email job", {
      recipient: job.data.to,
      template: job.data.template,
      provider: 'sendgrid'
    });
    
    // Email sending logic...
    
    logger.info("Email sent successfully", {
      messageId: 'msg_12345',
      deliveryTime: '2.3s'
    });
  }
}
```

## Built-in Context Support

Plip's built-in `withContext()` method is the **recommended way** to add consistent context to your logs:

::: tip Pro Tip
The `withContext()` method creates a new logger instance that automatically includes your context in every log message. Context is merged, not overwritten, so you can chain contexts together!
:::

### Basic Context Usage

```typescript
import { plip } from '@ru-dr/plip';

// Create domain-specific loggers
const authLogger = plip.withContext({ scope: "auth" });
const paymentLogger = plip.withContext({ scope: "payment", processor: "stripe" });
const emailLogger = plip.withContext({ scope: "email", provider: "sendgrid" });

// All logs from authLogger will include { scope: "auth" }
authLogger.info("User login attempt", { userId: 123 });
// Output: [INFO] User login attempt {"scope":"auth","userId":123}

authLogger.success("Login successful", { userId: 123, method: "oauth" });
// Output: [SUCCESS] Login successful {"scope":"auth","userId":123,"method":"oauth"}
```

### Context Chaining & Extension

One of the most powerful features of `withContext()` is the ability to chain and extend context:

::: code-group

```typescript [Step by Step]
// Step 1: Base service logger
const apiLogger = plip.withContext({ 
  service: "api",
  version: "2.1.0" 
});

// Step 2: Request-specific logger (extends base)
const requestLogger = apiLogger.withContext({ 
  requestId: 'req-456',
  userId: 789 
});

// Step 3: Operation-specific logger (extends request)
const dbOperationLogger = requestLogger.withContext({
  operation: 'user_lookup',
  table: 'users'
});

// All context is preserved and merged
dbOperationLogger.debug("Executing query");
// Includes: service, version, requestId, userId, operation, table
```

```typescript [Real Example]
// E-commerce checkout flow
const checkoutLogger = plip.withContext({ 
  flow: 'checkout',
  version: '2.0' 
});

const userCheckout = checkoutLogger.withContext({
  userId: 'user_123',
  sessionId: 'sess_abc'
});

const paymentStep = userCheckout.withContext({
  step: 'payment',
  amount: 99.99,
  currency: 'USD'
});

paymentStep.info("Processing payment");
// Output includes all context from the chain
```

:::

### Advanced Context Patterns

#### Request-Scoped Logging in Express

Perfect for tracking requests across your entire application:

```typescript
import express from 'express';
import { plip } from '@ru-dr/plip';

const app = express();

// Middleware to create request-scoped logger
app.use((req, res, next) => {
  const requestContext = {
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  };
  
  // Add user info if authenticated
  if (req.user) {
    requestContext.userId = req.user.id;
    requestContext.userRole = req.user.role;
  }
  
  // Create request-scoped logger
  req.logger = plip.withContext(requestContext);
  
  req.logger.info("Request started");
  
  // Log response when finished
  res.on('finish', () => {
    req.logger.info("Request completed", {
      statusCode: res.statusCode,
      contentLength: res.get('content-length'),
      responseTime: Date.now() - req.startTime
    });
  });
  
  req.startTime = Date.now();
  next();
});

// Route handlers automatically get contextual logging
app.get('/api/users', async (req, res) => {
  // req.logger already includes requestId, method, url, etc.
  req.logger.info("Fetching users list");
  
  try {
    const users = await userService.getUsers();
    req.logger.success("Users fetched successfully", { count: users.length });
    res.json(users);
  } catch (error) {
    req.logger.error("Failed to fetch users", { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### Feature Flag Context

Track how feature flags affect your application:

```typescript
// Create logger with feature flag context
function createFeatureFlagLogger(userId: string, flags: Record<string, boolean>) {
  return plip.withContext({
    userId,
    featureFlags: flags,
    flagsVersion: 'v2.1.0'
  });
}

// Usage
const userLogger = createFeatureFlagLogger('user_123', {
  newDashboard: true,
  betaFeatures: false,
  experimentalAuth: true
});

userLogger.info("User accessed dashboard", { 
  dashboardVersion: flags.newDashboard ? 'v2' : 'v1' 
});
// Output includes userId, featureFlags, and flagsVersion
```

#### Environment-Specific Context

Automatically adapt context based on your environment:

```typescript
const createEnvironmentLogger = () => {
  const baseContext = {
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    appVersion: process.env.APP_VERSION,
    buildTime: process.env.BUILD_TIME
  };
  
  // Add environment-specific context
  if (process.env.NODE_ENV === 'production') {
    baseContext.region = process.env.AWS_REGION;
    baseContext.instanceId = process.env.EC2_INSTANCE_ID;
  } else {
    baseContext.developer = process.env.USER;
    baseContext.branch = process.env.GIT_BRANCH;
  }
  
  return plip.withContext(baseContext);
};

const envLogger = createEnvironmentLogger();
envLogger.info("Application started");
```

#### Microservice Context

Perfect for distributed systems and service communication:

```typescript
// Service registry for consistent service identification
const createServiceLogger = (serviceName: string, serviceVersion: string) => {
  return plip.withContext({
    service: serviceName,
    version: serviceVersion,
    instanceId: process.env.INSTANCE_ID || 'local',
    region: process.env.SERVICE_REGION || 'us-east-1',
    cluster: process.env.CLUSTER_NAME || 'development'
  });
};

// User service
const userServiceLogger = createServiceLogger('user-service', '1.2.3');
userServiceLogger.info("User service started", { port: 3001 });

// Payment service  
const paymentServiceLogger = createServiceLogger('payment-service', '2.1.0');
paymentServiceLogger.info("Payment service started", { port: 3002 });

// Cross-service communication logging
const createCrossServiceLogger = (fromService: string, toService: string, operationType: string) => {
  return plip.withContext({
    operation: 'cross_service_call',
    fromService,
    toService,
    operationType,
    traceId: crypto.randomUUID()
  });
};

// Usage
const crossServiceLogger = createCrossServiceLogger('user-service', 'payment-service', 'charge_user');
crossServiceLogger.info("Initiating cross-service call", { amount: 99.99, currency: 'USD' });
```

#### Legacy Context-Aware Logger (Custom Implementation)

For more complex scenarios, you can still create custom wrapper classes:

```typescript
class ContextLogger {
  private logger: Logger;
  private context: Record<string, any>;
  
  constructor(context: Record<string, any>, config?: PlipConfig) {
    this.context = context;
    this.logger = createPlip(config);
  }
  
  private addContext(data?: any) {
    return { ...this.context, ...data };
  }
  
  info(message: string, data?: any) {
    this.logger.info(message, this.addContext(data));
  }
  
  warn(message: string, data?: any) {
    this.logger.warn(message, this.addContext(data));
  }
  
  error(message: string, data?: any) {
    this.logger.error(message, this.addContext(data));
  }
  
  success(message: string, data?: any) {
    this.logger.success(message, this.addContext(data));
  }
}

// Usage
const requestLogger = new ContextLogger({
  requestId: 'req-123',
  userId: 456,
  service: 'api'
});

requestLogger.info("Processing request"); 
// Output includes: { requestId: 'req-123', userId: 456, service: 'api' }
```

## Enterprise Patterns

### Logger Registry Pattern

Create a centralized registry for managing loggers across large applications:

```typescript
class LoggerRegistry {
  private static loggers = new Map<string, any>();
  private static defaultConfig: PlipConfig = {
    enableColors: true,
    enabledLevels: ['info', 'success', 'warn', 'error']
  };

  static getLogger(name: string, config?: Partial<PlipConfig>): any {
    if (!this.loggers.has(name)) {
      const finalConfig = { ...this.defaultConfig, ...config };
      const logger = createPlip(finalConfig).withContext({
        logger: name,
        created: new Date().toISOString()
      });
      this.loggers.set(name, logger);
    }
    return this.loggers.get(name);
  }

  static updateConfig(name: string, config: Partial<PlipConfig>) {
    const existing = this.loggers.get(name);
    if (existing) {
      // Re-create logger with new config
      const finalConfig = { ...this.defaultConfig, ...config };
      const newLogger = createPlip(finalConfig).withContext({
        logger: name,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });
      this.loggers.set(name, newLogger);
    }
  }

  static getAllLoggers(): string[] {
    return Array.from(this.loggers.keys());
  }

  static clearRegistry() {
    this.loggers.clear();
  }
}

// Usage across your enterprise application
const userServiceLogger = LoggerRegistry.getLogger('user-service');
const paymentServiceLogger = LoggerRegistry.getLogger('payment-service', {
  enableColors: false
});
const authLogger = LoggerRegistry.getLogger('auth-service');
```

### Correlation ID Pattern

Track requests across microservices with correlation IDs:

```typescript
interface CorrelationContext {
  correlationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
}

class CorrelationLogger {
  private baseLogger: any;
  private context: CorrelationContext;

  constructor(baseLogger: any, context: CorrelationContext) {
    this.baseLogger = baseLogger;
    this.context = context;
  }

  private enrichData(data: any = {}) {
    return {
      ...data,
      correlation: this.context,
      timestamp: new Date().toISOString()
    };
  }

  info(message: string, data?: any) {
    this.baseLogger.info(message, this.enrichData(data));
  }

  warn(message: string, data?: any) {
    this.baseLogger.warn(message, this.enrichData(data));
  }

  error(message: string, data?: any) {
    this.baseLogger.error(message, this.enrichData(data));
  }

  success(message: string, data?: any) {
    this.baseLogger.success(message, this.enrichData(data));
  }

  // Create child logger for nested operations
  createChildLogger(operation: string): CorrelationLogger {
    const childContext: CorrelationContext = {
      ...this.context,
      parentSpanId: this.context.spanId,
      spanId: crypto.randomUUID(),
      operation
    };
    
    return new CorrelationLogger(this.baseLogger, childContext);
  }
}

// Express middleware for correlation
function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  
  const context: CorrelationContext = {
    correlationId: correlationId as string,
    traceId: traceId as string,
    spanId: crypto.randomUUID(),
    service: 'api-gateway',
    operation: `${req.method}_${req.path}`
  };
  
  const baseLogger = plip.withContext({ 
    service: 'api-gateway',
    version: '1.0.0' 
  });
  
  req.logger = new CorrelationLogger(baseLogger, context);
  
  // Add correlation headers to response
  res.set({
    'X-Correlation-ID': correlationId,
    'X-Trace-ID': traceId
  });
  
  next();
}
```

### Multi-Tenant Logging

Handle multi-tenant applications with tenant-specific logging:

```typescript
interface TenantConfig {
  tenantId: string;
  tenantName: string;
  logLevel: string;
  retentionDays: number;
  allowDebug: boolean;
}

class MultiTenantLogger {
  private static tenantConfigs = new Map<string, TenantConfig>();
  private static loggers = new Map<string, any>();

  static registerTenant(config: TenantConfig) {
    this.tenantConfigs.set(config.tenantId, config);
  }

  static getLogger(tenantId: string, service: string) {
    const key = `${tenantId}:${service}`;
    
    if (!this.loggers.has(key)) {
      const tenantConfig = this.tenantConfigs.get(tenantId);
      
      if (!tenantConfig) {
        throw new Error(`Tenant ${tenantId} not registered`);
      }

      const logger = createPlip({
        enableColors: false,
        enabledLevels: this.getLevelsForTenant(tenantConfig)
      }).withContext({
        tenantId: tenantConfig.tenantId,
        tenantName: tenantConfig.tenantName,
        service,
        retentionPolicy: `${tenantConfig.retentionDays}d`
      });

      this.loggers.set(key, logger);
    }

    return this.loggers.get(key);
  }

  private static getLevelsForTenant(config: TenantConfig): string[] {
    const baseLevels = ['info', 'warn', 'error'];
    
    if (config.allowDebug) {
      baseLevels.unshift('debug', 'verbose');
    }
    
    return baseLevels;
  }
}

// Register tenants
MultiTenantLogger.registerTenant({
  tenantId: 'acme-corp',
  tenantName: 'ACME Corporation',
  logLevel: 'info',
  retentionDays: 90,
  allowDebug: false
});

MultiTenantLogger.registerTenant({
  tenantId: 'dev-tenant',
  tenantName: 'Development Tenant',
  logLevel: 'debug',
  retentionDays: 7,
  allowDebug: true
});

// Usage
const acmeLogger = MultiTenantLogger.getLogger('acme-corp', 'user-service');
const devLogger = MultiTenantLogger.getLogger('dev-tenant', 'user-service');
```

## Performance Considerations

### Memory Management

Optimize memory usage in high-throughput applications:

```typescript
class MemoryOptimizedLogger {
  private logger: any;
  private messageCache = new Map<string, number>();
  private readonly maxCacheSize = 1000;
  private readonly duplicateThreshold = 10;

  constructor(config: PlipConfig) {
    this.logger = createPlip(config);
  }

  // Deduplicate similar messages to reduce memory
  private shouldLog(message: string): boolean {
    const count = this.messageCache.get(message) || 0;
    
    if (count > 0 && count % this.duplicateThreshold !== 0) {
      this.messageCache.set(message, count + 1);
      return false;
    }
    
    this.messageCache.set(message, count + 1);
    
    // Prevent cache from growing too large
    if (this.messageCache.size > this.maxCacheSize) {
      const firstKey = this.messageCache.keys().next().value;
      this.messageCache.delete(firstKey);
    }
    
    return true;
  }

  info(message: string, data?: any) {
    if (this.shouldLog(message)) {
      const finalData = data || {};
      const count = this.messageCache.get(message);
      
      if (count > 1) {
        finalData._duplicateCount = count;
      }
      
      this.logger.info(message, finalData);
    }
  }

  warn(message: string, data?: any) {
    // Always log warnings
    this.logger.warn(message, data);
  }

  error(message: string, data?: any) {
    // Always log errors
    this.logger.error(message, data);
  }
}
```

### Asynchronous Logging

Implement async logging for better performance:

```typescript
class AsyncLogger {
  private logger: any;
  private logQueue: Array<{ level: string; message: string; data: any }> = [];
  private processing = false;
  private readonly batchSize = 50;
  private readonly flushInterval = 5000; // 5 seconds

  constructor(config: PlipConfig) {
    this.logger = createPlip(config);
    this.startBatchProcessor();
  }

  private async enqueue(level: string, message: string, data?: any) {
    this.logQueue.push({ level, message, data });
    
    if (this.logQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush() {
    if (this.processing || this.logQueue.length === 0) return;

    this.processing = true;
    const batch = this.logQueue.splice(0, this.batchSize);

    try {
      // Process batch of logs
      for (const log of batch) {
        this.logger[log.level](log.message, log.data);
      }
    } finally {
      this.processing = false;
    }
  }

  private startBatchProcessor() {
    setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  async info(message: string, data?: any) {
    await this.enqueue('info', message, data);
  }

  async warn(message: string, data?: any) {
    await this.enqueue('warn', message, data);
  }

  async error(message: string, data?: any) {
    // Flush errors immediately
    this.logger.error(message, data);
  }

  async dispose() {
    await this.flush();
  }
}
```

### Resource-Conscious Logging

Monitor and limit resource usage:

```typescript
class ResourceLogger {
  private logger: any;
  private stats = {
    messagesPerSecond: 0,
    bytesLogged: 0,
    lastCheck: Date.now()
  };
  private readonly maxMessagesPerSecond = 1000;
  private readonly maxBytesPerSecond = 1024 * 1024; // 1MB

  constructor(config: PlipConfig) {
    this.logger = createPlip(config);
    this.startMonitoring();
  }

  private shouldThrottle(): boolean {
    const now = Date.now();
    const timeDiff = now - this.stats.lastCheck;
    
    if (timeDiff >= 1000) {
      // Reset counters every second
      this.stats.messagesPerSecond = 0;
      this.stats.bytesLogged = 0;
      this.stats.lastCheck = now;
      return false;
    }
    
    return (
      this.stats.messagesPerSecond >= this.maxMessagesPerSecond ||
      this.stats.bytesLogged >= this.maxBytesPerSecond
    );
  }

  private estimateSize(message: string, data?: any): number {
    const messageSize = Buffer.byteLength(message, 'utf8');
    const dataSize = data ? Buffer.byteLength(JSON.stringify(data), 'utf8') : 0;
    return messageSize + dataSize;
  }

  private updateStats(message: string, data?: any) {
    this.stats.messagesPerSecond++;
    this.stats.bytesLogged += this.estimateSize(message, data);
  }

  info(message: string, data?: any) {
    if (this.shouldThrottle()) {
      return; // Drop the message
    }
    
    this.updateStats(message, data);
    this.logger.info(message, data);
  }

  warn(message: string, data?: any) {
    // Always allow warnings
    this.updateStats(message, data);
    this.logger.warn(message, data);
  }

  error(message: string, data?: any) {
    // Always allow errors
    this.updateStats(message, data);
    this.logger.error(message, data);
  }

  private startMonitoring() {
    setInterval(() => {
      if (this.stats.messagesPerSecond > this.maxMessagesPerSecond * 0.8) {
        this.logger.warn("High logging volume detected", {
          messagesPerSecond: this.stats.messagesPerSecond,
          threshold: this.maxMessagesPerSecond
        });
      }
    }, 5000);
  }
}
```

## Best Practices

### Quick Reference Guide

::: tip Essential Guidelines
1. **Use appropriate log levels** - Match severity to log level
2. **Include context** - Add relevant data for debugging
3. **Structure your data** - Use consistent object formats
4. **Avoid sensitive data** - Never log passwords or tokens
5. **Environment awareness** - Configure differently for dev/prod
6. **Performance first** - Use async logging in high-traffic scenarios
:::

### Logger Configuration Standards

```typescript
// config/logger-standards.ts
export const LOGGER_STANDARDS = {
  // Development environment
  development: {
    enableColors: true,
    enabledLevels: ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace'],
    performance: false
  },
  
  // Staging environment  
  staging: {
    enableColors: true,
    enabledLevels: ['info', 'success', 'warn', 'error'],
    performance: true
  },
  
  // Production environment
  production: {
    enableColors: false,
    enabledLevels: ['warn', 'error'],
    performance: true
  },
  
  // Testing environment
  testing: {
    enableColors: false,
    enabledLevels: ['error'],
    performance: false
  }
} as const;

// Standard logger factory
export const createStandardLogger = (
  service: string, 
  version: string,
  environment = process.env.NODE_ENV || 'development'
) => {
  const config = LOGGER_STANDARDS[environment] || LOGGER_STANDARDS.development;
  
  return createPlip(config).withContext({
    service,
    version,
    environment,
    nodeVersion: process.version,
    pid: process.pid,
    created: new Date().toISOString()
  });
};
```

### Message Formatting Guidelines

```typescript
// Good: Clear, descriptive messages with context
const userLogger = createStandardLogger('user-service', '1.0.0');

userLogger.info("User registration completed", {
  userId: user.id,
  email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
  registrationMethod: 'oauth',
  provider: 'google',
  duration: '1.2s'
});

userLogger.warn("Password strength insufficient", {
  userId: user.id,
  strengthScore: 2,
  requiredScore: 4,
  suggestions: ['add numbers', 'add special characters']
});

userLogger.error("Email delivery failed", {
  userId: user.id,
  emailType: 'welcome',
  provider: 'sendgrid',
  errorCode: 'RATE_LIMIT_EXCEEDED',
  retryAttempt: 3,
  nextRetry: '2024-01-15T10:30:00Z'
});

// Avoid: Vague messages without context
userLogger.info("User created");
userLogger.warn("Password weak");
userLogger.error("Email failed");
```

### Error Handling Patterns

```typescript
// Recommended: Structured error logging
async function processPayment(paymentData: PaymentData) {
  const operationLogger = paymentLogger.withContext({
    operation: 'process_payment',
    paymentId: paymentData.id,
    amount: paymentData.amount,
    currency: paymentData.currency
  });

  operationLogger.info("Payment processing started");

  try {
    const result = await paymentProcessor.charge(paymentData);
    
    operationLogger.success("Payment processed successfully", {
      transactionId: result.transactionId,
      processingTime: result.processingTime,
      fees: result.fees
    });
    
    return result;
    
  } catch (error) {
    const errorContext = {
      errorType: error.constructor.name,
      errorMessage: error.message,
      errorCode: error.code,
      stack: error.stack,
      retryable: isRetryableError(error),
      processingTime: Date.now() - startTime
    };

    if (error.code === 'INSUFFICIENT_FUNDS') {
      operationLogger.warn("Payment declined - insufficient funds", errorContext);
    } else if (error.code === 'CARD_EXPIRED') {
      operationLogger.warn("Payment declined - card expired", errorContext);
    } else {
      operationLogger.error("Payment processing failed", errorContext);
    }

    throw error;
  }
}
```

### Testing Logger Configurations

```typescript
// test/logger.test.ts
describe('Logger Configuration', () => {
  it('should use correct config for production', () => {
    process.env.NODE_ENV = 'production';
    const logger = createStandardLogger('test-service', '1.0.0');
    
    // Test that production config is applied
    // The resolved config is private, so assert on behaviour instead
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    logger.info("suppressed in production");
    logger.error("visible in production");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).not.toMatch(/\u001b\[/); // colors disabled
    spy.mockRestore();
  });

  it('should include proper context', () => {
    const logger = createStandardLogger('user-service', '2.1.0');
    const spy = jest.spyOn(console, 'log');
    
    logger.info("Test message", { testData: 'value' });
    
    // Transports receive a single pre-formatted string
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('user-service')
    );
  });
});
```

### Performance Monitoring

```typescript
class LoggerPerformanceMonitor {
  private metrics = {
    totalLogs: 0,
    errorLogs: 0,
    avgProcessingTime: 0,
    lastReset: Date.now()
  };

  private wrapLogger(logger: any) {
    const originalMethods = ['info', 'warn', 'error', 'success'];
    
    originalMethods.forEach(method => {
      const original = logger[method];
      logger[method] = (...args: any[]) => {
        const start = Date.now();
        
        try {
          const result = original.apply(logger, args);
          this.recordMetric(method, Date.now() - start);
          return result;
        } catch (error) {
          this.recordError(method, error);
          throw error;
        }
      };
    });

    return logger;
  }

  private recordMetric(level: string, processingTime: number) {
    this.metrics.totalLogs++;
    
    if (level === 'error') {
      this.metrics.errorLogs++;
    }
    
    // Update average processing time
    this.metrics.avgProcessingTime = 
      (this.metrics.avgProcessingTime + processingTime) / 2;
  }

  private recordError(level: string, error: any) {
    console.error(`Logger error in ${level}:`, error);
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.lastReset;
    return {
      ...this.metrics,
      logsPerSecond: this.metrics.totalLogs / (uptime / 1000),
      errorRate: this.metrics.errorLogs / this.metrics.totalLogs,
      uptime
    };
  }

  resetMetrics() {
    this.metrics = {
      totalLogs: 0,
      errorLogs: 0,
      avgProcessingTime: 0,
      lastReset: Date.now()
    };
  }
}

// Usage
const monitor = new LoggerPerformanceMonitor();
const logger = monitor.wrapLogger(createStandardLogger('api', '1.0.0'));

// Monitor performance every 30 seconds
setInterval(() => {
  const metrics = monitor.getMetrics();
  if (metrics.avgProcessingTime > 10) {
    console.warn('Logger performance degraded:', metrics);
  }
}, 30000);
```

## Conclusion

Custom loggers in Plip provide powerful capabilities for organizing, contextualizing, and managing your application's logging needs. By following these patterns and best practices, you can create robust, performant, and maintainable logging solutions that scale with your application.

### Next Steps

- **[Integration Examples](/examples/integration)** - Framework-specific implementations
- **[Best Practices Guide](/guide/best-practices)** - Optimize logging for production
- **[Configuration Reference](/api/configuration)** - Complete configuration options
