# Integration Examples

Learn how to integrate Plip with popular frameworks and tools.

## Express.js Integration

### Middleware Logging

```typescript
import express from 'express';
import { createPlip } from '@ru-dr/plip';

const app = express();
const logger = createPlip();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'success';
    
    logger[level]("Request completed", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
});
```

### Error Handler Middleware

```typescript
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});
```

## Fastify Integration

```typescript
import Fastify from 'fastify';
import { createPlip } from '@ru-dr/plip';

const fastify = Fastify();
const logger = createPlip();

// Plugin for request logging
fastify.addHook('onRequest', async (request, reply) => {
  logger.info("Request received", {
    method: request.method,
    url: request.url,
    ip: request.ip
  });
});

fastify.addHook('onResponse', async (request, reply) => {
  logger.success("Response sent", {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: reply.getResponseTime()
  });
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error("Request error", {
    error: error.message,
    url: request.url,
    method: request.method
  });
  
  reply.status(500).send({ error: 'Internal Server Error' });
});
```

## Next.js Integration

### API Route Logging

```typescript
// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, url } = req;
  
  logger.info("Next.js API call", { method, url });
  
  try {
    switch (method) {
      case 'GET':
        const users = await getUsers();
        logger.success("Users retrieved", { count: users.length });
        return res.status(200).json(users);
        
      case 'POST':
        const user = await createUser(req.body);
        logger.success("User created", { userId: user.id });
        return res.status(201).json(user);
        
      default:
        logger.warn("Method not allowed", { method });
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logger.error("API error", {
      method, 
      url, 
      error: error.message 
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Middleware for App Router

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  logger.info("Middleware executing", {
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent')
  });
  
  const response = NextResponse.next();
  
  response.headers.set('x-request-duration', `${Date.now() - start}ms`);
  
  logger.success("Middleware completed", {
    pathname: request.nextUrl.pathname,
    duration: `${Date.now() - start}ms`
  });
  
  return response;
}
```

## NestJS Integration

### Injectable Logger Service

```typescript
import { Injectable } from '@nestjs/common';
import { createPlip } from '@ru-dr/plip';
import type { Logger } from '@ru-dr/plip';

@Injectable()
export class LoggerService {
  private logger: Logger;
  
  constructor() {
    this.logger = createPlip({
      enableColors: true,
      enabledLevels: ['info', 'warn', 'error']
    });
  }
  
  info(message: string, data?: any) {
    this.logger.info(message, data);
  }
  
  warn(message: string, data?: any) {
    this.logger.warn(message, data);
  }
  
  error(message: string, data?: any) {
    this.logger.error(message, data);
  }
  
  success(message: string, data?: any) {
    this.logger.success(message, data);
  }
}
```

### Controller with Logging

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Controller('users')
export class UsersController {
  constructor(private readonly logger: LoggerService) {}
  
  @Get()
  async findAll() {
    this.logger.info("Fetching all users");
    
    try {
      const users = await this.usersService.findAll();
      this.logger.success("Users retrieved successfully", {
        count: users.length 
      });
      return users;
    } catch (error) {
      this.logger.error("Failed to fetch users", {
        error: error.message 
      });
      throw error;
    }
  }
  
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.info("Creating new user", {
      email: createUserDto.email 
    });
    
    try {
      const user = await this.usersService.create(createUserDto);
      this.logger.success("User created successfully", {
        userId: user.id 
      });
      return user;
    } catch (error) {
      this.logger.error("User creation failed", {
        email: createUserDto.email,
        error: error.message 
      });
      throw error;
    }
  }
}
```

## MongoDB/Mongoose Integration

```typescript
import mongoose from 'mongoose';
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();

// Connection logging
mongoose.connection.on('connecting', () => {
  logger.info("Connecting to MongoDB...");
});

mongoose.connection.on('connected', () => {
  logger.success("Connected to MongoDB", {
    host: mongoose.connection.host,
    name: mongoose.connection.name
  });
});

mongoose.connection.on('error', (err) => {
  logger.error("MongoDB connection error", {
    error: err.message 
  });
});

mongoose.connection.on('disconnected', () => {
  logger.warn("Disconnected from MongoDB");
});

// Query logging middleware
const schema = new mongoose.Schema({ /* ... */ });

schema.pre('save', function() {
  logger.debug("Document save operation", {
    collection: this.constructor.modelName,
    id: this._id
  });
});

schema.post('save', function() {
  logger.success("Document saved", {
    collection: this.constructor.modelName,
    id: this._id
  });
});
```

## Redis Integration

```typescript
import Redis from 'ioredis';
import { createPlip } from '@ru-dr/plip';

const logger = createPlip();

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info("Connecting to Redis...");
});

redis.on('ready', () => {
  logger.success("Redis connection ready");
});

redis.on('error', (err) => {
  logger.error("Redis connection error", {
    error: err.message 
  });
});

redis.on('close', () => {
  logger.warn("Redis connection closed");
});

// Wrapper with logging
class RedisLogger {
  constructor(private redis: Redis, private logger: Logger) {}
  
  async get(key: string) {
    this.logger.debug("Redis GET", { key });
    
    try {
      const value = await this.redis.get(key);
      this.logger.success("Redis GET success", {
        key, 
        found: !!value 
      });
      return value;
    } catch (error) {
      this.logger.error("Redis GET failed", {
        key, 
        error: error.message 
      });
      throw error;
    }
  }
  
  async set(key: string, value: string, ttl?: number) {
    this.logger.debug("Redis SET", { key, ttl });
    
    try {
      const result = ttl 
        ? await this.redis.setex(key, ttl, value)
        : await this.redis.set(key, value);
        
      this.logger.success("Redis SET success", { key, ttl });
      return result;
    } catch (error) {
      this.logger.error("Redis SET failed", {
        key, 
        error: error.message 
      });
      throw error;
    }
  }
}
```

## Jest Testing Integration

```typescript
// jest.setup.ts
import { createPlip } from '@ru-dr/plip';

// Create test-specific logger
const testLogger = createPlip({
  enableColors: false,
  enabledLevels: ['error'] // Only log errors in tests
});

// Make available globally
global.testLogger = testLogger;
```

```typescript
// user.test.ts
describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService(global.testLogger);
  });
  
  it('should create user successfully', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' };
    
    const user = await userService.create(userData);
    
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
  
  it('should handle creation errors', async () => {
    const invalidData = { email: 'invalid' };
    
    await expect(userService.create(invalidData))
      .rejects
      .toThrow('Invalid email format');
  });
});
```

## Docker Integration

### Dockerfile with Plip

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Standard environment variables Plip respects
ENV NODE_ENV=production
ENV NO_COLOR=1

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose Logging

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - NO_COLOR=1
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

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
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          NO_COLOR: '1'
```

## Performance Monitoring

### Integration with APM Tools

```typescript
import { createPlip } from '@ru-dr/plip';
import * as Sentry from '@sentry/node';

const logger = createPlip({
  enableColors: false,
  enabledLevels: ['info', 'warn', 'error']
});

// Custom logger that also sends to Sentry
const createMonitoredLogger = () => {
  return {
    info: (message: string, data?: any) => {
      logger.info(message, data);
      Sentry.addBreadcrumb({ message, data, level: 'info' });
    },
    
    warn: (message: string, data?: any) => {
      logger.warn(message, data);
      Sentry.addBreadcrumb({ message, data, level: 'warning' });
    },
    
    error: (message: string, data?: any) => {
      logger.error(message, data);
      Sentry.captureException(new Error(message), { extra: data });
    },
    
    critical: (message: string, data?: any) => {
      logger.error(message, data);
      Sentry.captureException(new Error(message), { 
        level: 'fatal',
        extra: data 
      });
    }
  };
};
```

## Best Practices for Integration

### 1. Environment Configuration

Always configure Plip based on your environment:

```typescript
const getLoggerConfig = () => {
  const env = process.env.NODE_ENV;
  const isContainer = !!process.env.DOCKER_CONTAINER;
  const isCI = !!process.env.CI;
  
  return {
    enableColors: !isContainer && !isCI,
    enabledLevels: env === 'production' 
      ? ['warn', 'error']
      : ['info', 'success', 'warn', 'error']
  };
};
```

### 2. Consistent Context

Add consistent context across your application:

```typescript
const createContextualLogger = (service: string) => {
  const baseLogger = createPlip(getLoggerConfig());
  
  return {
    info: (message: string, data = {}) => 
      baseLogger.info(message, { service, ...data }),
    error: (message: string, data = {}) => 
      baseLogger.error(message, { service, ...data })
  };
};
```

### 3. Error Boundaries

Implement error boundaries with logging:

```typescript
process.on('uncaughtException', (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason: String(reason),
    promise: promise.toString()
  });
});
```
