# Fastify Integration

Integrate Plip Logger with Fastify for high-performance, beautifully logged applications.

## Quick Setup

### Basic Integration

```typescript
import Fastify from 'fastify';
import { plip } from '@ru-dr/plip';

const fastify = Fastify({
  logger: false // Disable built-in logger to use Plip
});

// Log server startup
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    plip.error("Failed to start server", err);
    process.exit(1);
  }
  plip.success(`Fastify server running at ${address}`);
});
```

### Request Logging Plugin

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

async function plipLoggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.startTime = Date.now();
    request.requestId = crypto.randomUUID();
    
    plip.info("Request started", {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip
    });
  });
  
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - (request.startTime || 0);
    const logLevel = reply.statusCode >= 400 ? 'error' : 'success';
    
    plip[logLevel]("Request completed", {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      responseTime: duration
    });
  });
}

// Register the plugin
fastify.register(fp(plipLoggerPlugin));
```

## Advanced Patterns

### Schema Validation Logging

```typescript
const userSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 }
  }
};

fastify.post('/users', {
  schema: {
    body: userSchema
  },
  preValidation: async (request, reply) => {
    plip.debug("Validating user data", {
      requestId: request.requestId,
      hasEmail: !!request.body.email,
      hasPassword: !!request.body.password
    });
  }
}, async (request, reply) => {
  plip.success("User data validated", {
    requestId: request.requestId
  });
  
  // Handle user creation
  return { message: 'User created successfully' };
});
```

### Error Handling

```typescript
// Global error handler
fastify.setErrorHandler(async (error, request, reply) => {
  const errorData = {
    requestId: request.requestId,
    method: request.method,
    url: request.url,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  };
  
  if (error.statusCode === 400) {
    plip.warn("Bad request", errorData);
  } else if (error.statusCode === 401) {
    plip.warn("Unauthorized", errorData);
  } else if (error.statusCode === 404) {
    plip.info("Not found", errorData);
  } else if (error.statusCode >= 500) {
    plip.error("Server error", errorData);
  } else {
    plip.debug("Client error", errorData);
  }
  
  reply.status(error.statusCode || 500).send({
    error: error.message,
    requestId: request.requestId
  });
});

// Validation error handler
fastify.setSchemaErrorFormatter((errors, dataVar) => {
  plip.warn("Schema validation failed", {
    errors: errors.map(err => ({
      field: err.instancePath,
      message: err.message,
      value: err.data
    }))
  });
  
  return new Error('Validation failed');
});
```

## Route-Specific Logging

### Authentication Routes

```typescript
fastify.post('/auth/login', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { email, password } = request.body;
  
  plip.info("Authentication attempt", {
    requestId: request.requestId,
    email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
    ip: request.ip
  });
  
  try {
    const user = await authenticateUser(email, password);
    
    plip.success("User authenticated", {
      requestId: request.requestId,
      userId: user.id,
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
    });
    
    const token = await generateToken(user);
    return { token, user: { id: user.id, name: user.name } };
    
  } catch (error) {
    plip.warn("Authentication failed", {
      requestId: request.requestId,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      reason: error.message
    });
    
    reply.status(401);
    return { error: 'Authentication failed' };
  }
});
```

### API Routes with Performance Tracking

```typescript
fastify.get('/api/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  }
}, async (request, reply) => {
  const { id } = request.params;
  const dbStartTime = Date.now();
  
  plip.debug("Fetching user", {
    requestId: request.requestId,
    userId: id
  });
  
  try {
    const user = await User.findById(id);
    const dbDuration = Date.now() - dbStartTime;
    
    if (!user) {
      plip.warn("User not found", {
        requestId: request.requestId,
        userId: id,
        dbDuration: `${dbDuration}ms`
      });
      
      reply.status(404);
      return { error: 'User not found' };
    }
    
    plip.success("User retrieved", {
      requestId: request.requestId,
      userId: id,
      dbDuration: `${dbDuration}ms`,
      userActive: user.active
    });
    
    return user;
    
  } catch (error) {
    const dbDuration = Date.now() - dbStartTime;
    
    plip.error("Database error", {
      requestId: request.requestId,
      userId: id,
      dbDuration: `${dbDuration}ms`,
      error: error.message
    });
    
    reply.status(500);
    return { error: 'Internal server error' };
  }
});
```

## Plugin System Integration

### Custom Plip Plugin

```typescript
import fp from 'fastify-plugin';

import type { LogLevel } from '@ru-dr/plip';

interface PlipOptions {
  levels?: LogLevel[];
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

async function plipPlugin(fastify: FastifyInstance, options: PlipOptions) {
  // Configure Plip based on options.
  // `configure()` returns a NEW logger; it does not mutate the original.
  const logger = plip.configure({
    enabledLevels: options.levels || ['info', 'warn', 'error', 'success']
  });
  
  // Add Plip to Fastify instance
  fastify.decorate('plip', logger);
  
  // Request logging with optional body logging
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
    request.requestId = crypto.randomUUID();
    
    const logData = {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip
    };
    
    if (options.includeRequestBody && request.body) {
      logData.body = request.body;
    }
    
    logger.info("Request received", logData);
  });
  
  // Response logging
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (options.includeResponseBody) {
      logger.debug("Response body", {
        requestId: request.requestId,
        body: payload
      });
    }
    
    return payload;
  });
  
  fastify.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - (request.startTime || 0);
    
    logger.success("Request completed", {
      requestId: request.requestId,
      statusCode: reply.statusCode,
      duration: `${duration}ms`
    });
  });
}

// Export as Fastify plugin
export default fp(plipPlugin, {
  name: 'plip-logger',
  fastify: '4.x'
});
```

### Using the Plugin

```typescript
import plipPlugin from './plugins/plip-plugin';

// Register with options
fastify.register(plipPlugin, {
  levels: ['debug', 'info', 'warn', 'error', 'success'],
  includeRequestBody: process.env.NODE_ENV === 'development',
  includeResponseBody: false
});

// Use in routes
fastify.get('/test', async (request, reply) => {
  // Access Plip through Fastify instance
  fastify.plip.info("Test route accessed", {
    requestId: request.requestId
  });
  
  return { message: 'Hello from Plip!' };
});
```

## Complete Example

```typescript
import Fastify from 'fastify';
import { plip } from '@ru-dr/plip';

const fastify = Fastify({
  logger: false,
  trustProxy: true
});

// Environment-specific configuration
// `configure()` returns a NEW logger; it does not mutate the original.
const logger = process.env.NODE_ENV === 'production'
  ? plip.configure({
      enabledLevels: ['info', 'warn', 'error', 'success'],
      enableColors: false,
      enableStructuredOutput: true // JSON line per log
    })
  : plip.configure({
      enabledLevels: ['debug', 'info', 'warn', 'error', 'success', 'trace', 'verbose'],
      enableColors: true
    });

// Request ID and timing middleware
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
  request.requestId = crypto.randomUUID();
  
  logger.debug("Request started", {
    requestId: request.requestId,
    method: request.method,
    url: request.url,
    ip: request.ip
  });
});

// Response logging
fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - (request.startTime || 0);
  const logLevel = reply.statusCode >= 400 ? 'warn' : 'success';
  
  plip[logLevel]("Request metrics", {
    requestId: request.requestId,
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration,
    responseTime: `${duration}ms`
  });
});

// Error handling
fastify.setErrorHandler(async (error, request, reply) => {
  logger.error("Request error", {
    requestId: request.requestId,
    method: request.method,
    url: request.url,
    error: {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode
    }
  });
  
  reply.status(error.statusCode || 500).send({
    error: error.message,
    requestId: request.requestId
  });
});

// Routes
fastify.get('/', async (request, reply) => {
  logger.info("Home route accessed", {
    requestId: request.requestId
  });
  
  return { 
    message: 'Welcome to Plip Fastify App!',
    requestId: request.requestId 
  };
});

fastify.get('/health', async (request, reply) => {
  logger.debug("Health check", {
    requestId: request.requestId
  });
  
  return { 
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  };
});

// Start server
const start = async () => {
  try {
    const address = await fastify.listen({ 
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0'
    });
    
    logger.success("Fastify server started", {
      address,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      fastifyVersion: fastify.version
    });
    
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
```

## Performance Considerations

### High-Traffic Applications

```typescript
// Optimize for high throughput
fastify.addHook('onRequest', async (request, reply) => {
  // Only log essential info for high-traffic routes
  if (request.url.startsWith('/api/high-traffic')) {
    plip.info("High traffic request", {
      method: request.method,
      url: request.url
    });
  } else {
    plip.debug("Regular request", {
      method: request.method,
      url: request.url,
      headers: request.headers
    });
  }
});
```

### Conditional Logging

```typescript
// Use conditional logging based on environment
const shouldLogDetails = process.env.NODE_ENV === 'development';

fastify.addHook('onRequest', async (request, reply) => {
  if (shouldLogDetails) {
    plip.debug("Request details", {
      headers: request.headers,
      query: request.query
    });
  }
});
```

## Next Steps

- [Next.js Integration](/integration/nextjs) - Frontend framework integration
- [Database Integration](/integration/database) - Database logging patterns
- [Testing](/integration/testing) - Testing Fastify apps with Plip
