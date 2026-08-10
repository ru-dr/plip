# Express.js Integration

Learn how to integrate Plip Logger with Express.js applications for beautiful request logging and error handling.

## Quick Setup

### Basic Integration

```typescript
import express from 'express';
import { plip } from '@ru-dr/plip';

const app = express();

// Log server startup
app.listen(3000, () => {
  plip.success("Express server started on port 3000");
});
```

### Request Logging Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log incoming request
  plip.info("Incoming request", {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'error' : 'success';
    
    plip[level]("Request completed", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
}

// Use the middleware
app.use(requestLogger);
```

## Advanced Patterns

### Structured Request Logging

```typescript
interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  ip: string;
}

// Enhanced request logger with correlation IDs
function advancedRequestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  const logData: RequestLogData = {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    sessionId: req.sessionID,
    ip: req.ip
  };
  
  plip.info("Request started", logData);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    plip.info("Request finished", {
      ...logData,
      statusCode: res.statusCode,
      duration,
      responseSize: res.get('Content-Length')
    });
  });
  
  next();
}
```

### Error Handling

```typescript
// Error logging middleware
function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  const errorData = {
    requestId: (req as any).requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };
  
  if (err.name === 'ValidationError') {
    plip.warn("Validation error", errorData);
  } else if (err.name === 'UnauthorizedError') {
    plip.warn("Unauthorized access attempt", errorData);
  } else {
    plip.error("Unhandled error", errorData);
  }
  
  next(err);
}

app.use(errorLogger);
```

## Route-Specific Logging

### Authentication Routes

```typescript
app.post('/auth/login', async (req, res) => {
  const { email } = req.body;
  
  plip.info("Login attempt", {
    email: email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  try {
    const user = await authenticateUser(email, req.body.password);
    
    plip.success("User authenticated", {
      userId: user.id,
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      lastLogin: new Date()
    });
    
    res.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    plip.warn("Authentication failed", {
      email: email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      reason: error.message,
      ip: req.ip
    });
    
    res.status(401).json({ error: 'Authentication failed' });
  }
});
```

### API Routes

```typescript
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const requestId = (req as any).requestId;
  
  plip.debug("Fetching user", { userId: id, requestId });
  
  try {
    const user = await User.findById(id);
    
    if (!user) {
      plip.warn("User not found", { userId: id, requestId });
      return res.status(404).json({ error: 'User not found' });
    }
    
    plip.success("User fetched", {
      userId: id, 
      requestId,
      userData: {
        name: user.name,
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      }
    });
    
    res.json(user);
  } catch (error) {
    plip.error("Database error", {
      userId: id,
      requestId,
      error: error.message
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Database Integration

### MongoDB with Mongoose

```typescript
import mongoose from 'mongoose';

// Database connection logging
mongoose.connection.on('connected', () => {
  plip.success("MongoDB connected", {
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name
  });
});

mongoose.connection.on('error', (error) => {
  plip.error("MongoDB connection error", error);
});

mongoose.connection.on('disconnected', () => {
  plip.warn("MongoDB disconnected");
});

// Query logging
mongoose.set('debug', (collectionName: string, method: string, query: any) => {
  plip.debug("MongoDB query", {
    collection: collectionName,
    method,
    query: JSON.stringify(query).substring(0, 200) + '...'
  });
});
```

## Environment-Specific Configuration

### Development Setup

```typescript
if (process.env.NODE_ENV === 'development') {
  // Enhanced logging for development
  app.use((req, res, next) => {
    plip.verbose("Development request details", {
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  });
}
```

### Production Setup

```typescript
if (process.env.NODE_ENV === 'production') {
  // Configure for production logging
  // `configure()` returns a NEW logger; it does not mutate the original
  const prodLogger = plip.configure({
    enabledLevels: ['info', 'warn', 'error', 'success'],
    enableColors: false,
    enableStructuredOutput: true, // JSON line per log, for log aggregation
    enableTimestamp: true
  });
  
  // Only log essential information
  app.use((req, res, next) => {
    prodLogger.info("Request", {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    next();
  });
}
```

## Complete Example

```typescript
import express from 'express';
import { plip } from '@ru-dr/plip';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  (req as any).requestId = crypto.randomUUID();
  next();
});

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;
  
  plip.info("Request received", {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'success';
    
    plip[logLevel]("Request completed", {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
});

// Routes
app.get('/', (req, res) => {
  plip.info("Home page accessed");
  res.json({ message: 'Welcome to Plip Express App!' });
});

app.get('/health', (req, res) => {
  plip.debug("Health check");
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  plip.error("Unhandled error", {
    requestId: (req as any).requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  });
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  plip.success("Express server running", {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});
```

## Best Practices

### Security Considerations

```typescript
// Never log sensitive data
app.post('/auth/login', (req, res) => {
  // NEVER log passwords
  // plip.info("Login attempt", req.body);
  
  // Log safely
  plip.info("Login attempt", {
    email: req.body.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
    ip: req.ip,
    timestamp: new Date()
  });
});
```

### Performance Tips

```typescript
// Use appropriate log levels
app.use((req, res, next) => {
  // Only log detailed info in development
  if (process.env.NODE_ENV === 'development') {
    plip.debug("Request details", { headers: req.headers });
  }
  
  // Always log important events
  plip.info("Request", { method: req.method, url: req.url });
  
  next();
});
```

## Next Steps

- [Fastify Integration](/integration/fastify) - Similar patterns for Fastify
- [Database Integration](/integration/database) - Database-specific logging
- [Testing](/integration/testing) - Testing with Plip logs
