# Next.js Integration

This guide covers integrating Plip Logger into your Next.js applications, including both client-side and server-side logging configurations.

## Installation

::: code-group

```sh [npm]
$ npm install @ru-dr/plip
```

```sh [yarn]
$ yarn add @ru-dr/plip
```

```sh [pnpm]
$ pnpm add @ru-dr/plip
```

```sh [bun]
$ bun add @ru-dr/plip
```

:::

## Basic Setup

### Server-Side Logging

Create a logger instance for server-side operations:

```typescript
// lib/logger.ts
import { createSSRLogger } from '@ru-dr/plip'

export const logger = createSSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['warn', 'error']
    : ['debug', 'info', 'success', 'warn', 'error'],
  enableTimestamp: true,
  enableColors: process.env.NODE_ENV !== 'production'
})
```

### API Routes

Use Plip Logger in your Next.js API routes:

```typescript
// pages/api/users.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '../../lib/logger'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('API request received', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent']
  })

  try {
    // Your API logic here
    const users = await fetchUsers()
    
    logger.debug('Users fetched successfully', { count: users.length })
    res.status(200).json(users)
  } catch (error) {
    logger.error('Failed to fetch users', { error })
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

### App Router (Next.js 13+)

For the new App Router:

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../lib/logger'

export async function GET(request: NextRequest) {
  logger.info('API request received', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  })

  try {
    const users = await fetchUsers()
    
    logger.debug('Users fetched successfully', { count: users.length })
    return NextResponse.json(users)
  } catch (error) {
    logger.error('Failed to fetch users', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Middleware Integration

Add logging to your Next.js middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['info', 'success', 'warn', 'error'],
  enableTimestamp: true
})

export function middleware(request: NextRequest) {
  const start = Date.now()
  
  logger.info('Request started', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.ip || request.headers.get('x-forwarded-for')
  })

  const response = NextResponse.next()
  
  // Add response time header
  const duration = Date.now() - start
  response.headers.set('x-response-time', `${duration}ms`)
  
  logger.info('Request completed', {
    method: request.method,
    url: request.url,
    status: response.status,
    duration: `${duration}ms`
  })

  return response
}

export const config = {
  matcher: '/api/:path*'
}
```

## Server Components

Log in Server Components (App Router):

```typescript
// app/users/page.tsx
import { logger } from '../../lib/logger'

async function fetchUsers() {
  logger.debug('Fetching users from database')
  
  try {
    const users = await db.user.findMany()
    logger.info('Users fetched successfully', { count: users.length })
    return users
  } catch (error) {
    logger.error('Failed to fetch users', { error })
    throw error
  }
}

export default async function UsersPage() {
  const users = await fetchUsers()
  
  return (
    <div>
      <h1>Users ({users.length})</h1>
      {/* Render users */}
    </div>
  )
}
```

## Client-Side Logging

For client-side logging, create a separate logger configuration:

```typescript
// lib/client-logger.ts
import { createCSRLogger } from '@ru-dr/plip'

export const clientLogger = createCSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['error']
    : ['debug', 'info', 'success', 'warn', 'error'],
  // Disable colors in production for better browser console readability
  enableColors: process.env.NODE_ENV !== 'production'
})
```

Use in client components:

```typescript
// components/UserForm.tsx
'use client'

import { useState } from 'react'
import { clientLogger } from '../lib/client-logger'

export default function UserForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    clientLogger.info('Form submission started')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const user = await response.json()
      clientLogger.info('User created successfully', { userId: user.id })
    } catch (error) {
      clientLogger.error('Failed to create user', { error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## Environment-Based Configuration

Configure different log levels for different environments:

```typescript
// lib/logger.ts
import { createPlip, type LogLevel } from '@ru-dr/plip'

const getLogLevels = (): LogLevel[] => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return ['warn', 'error']
    case 'test':
      return ['error']
    case 'development':
    default:
      return ['debug', 'info', 'success', 'warn', 'error']
  }
}

export const logger = createPlip({
  enabledLevels: getLogLevels(),
  enableTimestamp: true,
  enableColors: process.env.NODE_ENV === 'development',
  // Add request ID for tracing in production
  includeRequestId: process.env.NODE_ENV === 'production',
  // Emit one JSON object per line in production
  enableStructuredOutput: process.env.NODE_ENV === 'production'
})
```

## Error Boundaries with Logging

Create an error boundary that logs errors:

```typescript
// components/ErrorBoundary.tsx
'use client'

import React from 'react'
import { clientLogger } from '../lib/client-logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error }>
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    clientLogger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback error={this.state.error!} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  )
}
```

## Performance Monitoring

Track performance metrics with Plip Logger:

```typescript
// lib/performance.ts
import { logger } from './logger'

export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now()
    logger.debug(`Starting ${name}`)

    try {
      const result = await fn()
      const duration = Date.now() - start
      
      logger.info(`${name} completed`, { duration: `${duration}ms` })
      resolve(result)
    } catch (error) {
      const duration = Date.now() - start
      
      logger.error(`${name} failed`, { 
        error,
        duration: `${duration}ms`
      })
      reject(error)
    }
  })
}

// Usage in API routes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const users = await measurePerformance('fetchUsers', async () => {
    return await db.user.findMany()
  })

  res.json(users)
}
```

## Structured Logging

Implement structured logging for better log analysis:

```typescript
// lib/structured-logger.ts
import { createPlip, type Logger, type LogLevel } from '@ru-dr/plip'

interface LogContext {
  requestId?: string
  userId?: string
  action?: string
  resource?: string
}

class StructuredLogger {
  private logger: Logger
  private context: LogContext = {}

  constructor() {
    this.logger = createPlip({
      enabledLevels: (process.env.LOG_LEVELS?.split(',') as LogLevel[]) ??
        ['info', 'success', 'warn', 'error'],
      enableTimestamp: true,
      enableStructuredOutput: true
    })
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context }
  }

  info(message: string, data?: any) {
    this.logger.info(message, { ...this.context, ...data })
  }

  error(message: string, data?: any) {
    this.logger.error(message, { ...this.context, ...data })
  }

  warn(message: string, data?: any) {
    this.logger.warn(message, { ...this.context, ...data })
  }

  debug(message: string, data?: any) {
    this.logger.debug(message, { ...this.context, ...data })
  }
}

export const structuredLogger = new StructuredLogger()
```

## Deployment Considerations

### Vercel

When deploying to Vercel, logs are automatically captured:

```javascript
// next.config.js
module.exports = {
  // Enable logging in production
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}
```

### Docker

Configure logging for containerized deployments:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
# Read by your own logger setup code (Plip itself only reads NODE_ENV)
ENV LOG_LEVELS=info,success,warn,error

# Copy application
WORKDIR /app
COPY . .

# Install dependencies and build
RUN npm ci --only=production
RUN npm run build

# Start the application
CMD ["npm", "start"]
```

## Best Practices

1. **Separate Client and Server Loggers**: Use different configurations for client-side and server-side logging
2. **Environment-Specific Levels**: Set appropriate log levels for each environment
3. **Structured Data**: Include relevant context in your log messages
4. **Performance Tracking**: Monitor API response times and database queries
5. **Error Boundaries**: Implement proper error handling with logging
6. **Security**: Avoid logging sensitive information like passwords or tokens
7. **Request Tracing**: Use request IDs to trace requests across your application

## Troubleshooting

### Common Issues

**Logs not appearing in production:**
- Check your log level configuration
- Ensure `NODE_ENV` is set correctly
- Verify Vercel function logs in the dashboard

**Client-side logging not working:**
- Check browser console settings
- Verify client logger configuration
- Ensure the logger is imported correctly in client components

**Performance impact:**
- Use appropriate log levels for production
- Consider using structured logging for better performance
- Implement log sampling for high-traffic applications

## Examples

Check out our [Next.js examples repository](https://github.com/ru-dr/plip/tree/main/examples/nextjs) for complete working examples including:

- Basic API routes with logging
- Middleware integration
- Error boundary implementation
- Performance monitoring setup
- Structured logging patterns
