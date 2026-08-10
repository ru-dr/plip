# NestJS Integration

This guide covers integrating Plip Logger into your NestJS applications, including custom providers, interceptors, and decorators.

## Installation

```bash
npm install @ru-dr/plip
# or
yarn add @ru-dr/plip
# or
pnpm add @ru-dr/plip
```

## Basic Setup

### Custom Logger Provider

Create a custom logger provider for NestJS:

```typescript
// src/common/logger/plip-logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common'
import { createPlip, type Logger, type LogLevel } from '@ru-dr/plip'

@Injectable()
export class PlipLoggerService implements LoggerService {
  private logger: Logger

  constructor() {
    this.logger = createPlip({
      enabledLevels: (process.env.LOG_LEVELS?.split(',') as LogLevel[]) ??
        ['info', 'warn', 'error', 'success'],
      enableTimestamp: true,
      enableColors: process.env.NODE_ENV !== 'production'
    })
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context })
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context })
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context })
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context })
  }

  verbose(message: any, context?: string) {
    this.logger.debug(message, { context, verbose: true })
  }
}
```

### Logger Module

Create a dedicated logger module:

```typescript
// src/common/logger/logger.module.ts
import { Global, Module } from '@nestjs/common'
import { PlipLoggerService } from './plip-logger.service'

@Global()
@Module({
  providers: [PlipLoggerService],
  exports: [PlipLoggerService]
})
export class LoggerModule {}
```

### Application Bootstrap

Configure the logger in your main application:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PlipLoggerService } from './common/logger/plip-logger.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  })

  const logger = app.get(PlipLoggerService)
  app.useLogger(logger)

  logger.log('Application starting...', 'Bootstrap')

  await app.listen(3000)
  
  logger.log('Application started on port 3000', 'Bootstrap')
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
})
```

## Controller Integration

Use the logger in your controllers:

```typescript
// src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { PlipLoggerService } from '../common/logger/plip-logger.service'

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: PlipLoggerService
  ) {}

  @Get()
  async findAll() {
    this.logger.log('Fetching all users', 'UsersController')
    
    try {
      const users = await this.usersService.findAll()
      this.logger.log(`Found ${users.length} users`, 'UsersController')
      return users
    } catch (error) {
      this.logger.error('Failed to fetch users', error.stack, 'UsersController')
      throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Creating new user', 'UsersController')
    
    try {
      const user = await this.usersService.create(createUserDto)
      this.logger.log(`User created with ID: ${user.id}`, 'UsersController')
      return user
    } catch (error) {
      this.logger.error('Failed to create user', error.stack, 'UsersController')
      throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST)
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching user with ID: ${id}`, 'UsersController')
    
    try {
      const user = await this.usersService.findOne(+id)
      if (!user) {
        this.logger.warn(`User not found: ${id}`, 'UsersController')
        throw new HttpException('User not found', HttpStatus.NOT_FOUND)
      }
      
      this.logger.debug(`User found: ${user.email}`, 'UsersController')
      return user
    } catch (error) {
      this.logger.error(`Failed to fetch user ${id}`, error.stack, 'UsersController')
      throw error
    }
  }
}
```

## Service Integration

Implement logging in your services:

```typescript
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { PlipLoggerService } from '../common/logger/plip-logger.service'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: PlipLoggerService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug('Creating user in database', 'UsersService')
    
    try {
      const user = this.usersRepository.create(createUserDto)
      const savedUser = await this.usersRepository.save(user)
      
      this.logger.log(`User created in database: ${savedUser.id}`, 'UsersService')
      return savedUser
    } catch (error) {
      this.logger.error('Database error creating user', error.stack, 'UsersService')
      throw error
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.debug('Querying all users from database', 'UsersService')
    
    try {
      const users = await this.usersRepository.find()
      this.logger.debug(`Retrieved ${users.length} users from database`, 'UsersService')
      return users
    } catch (error) {
      this.logger.error('Database error fetching users', error.stack, 'UsersService')
      throw error
    }
  }

  async findOne(id: number): Promise<User> {
    this.logger.debug(`Querying user ${id} from database`, 'UsersService')
    
    try {
      const user = await this.usersRepository.findOne({ where: { id } })
      
      if (!user) {
        this.logger.warn(`User ${id} not found in database`, 'UsersService')
        throw new NotFoundException(`User with ID ${id} not found`)
      }
      
      this.logger.debug(`User ${id} retrieved from database`, 'UsersService')
      return user
    } catch (error) {
      this.logger.error(`Database error fetching user ${id}`, error.stack, 'UsersService')
      throw error
    }
  }
}
```

## Interceptors

Create logging interceptors for automatic request/response logging:

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PlipLoggerService } from '../logger/plip-logger.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PlipLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const method = request.method
    const url = request.url
    const userAgent = request.get('User-Agent') || ''
    const ip = request.ip
    
    const start = Date.now()
    
    this.logger.log(
      `Incoming ${method} ${url}`,
      'HTTP',
      { method, url, userAgent, ip }
    )

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse()
        const statusCode = response.statusCode
        const duration = Date.now() - start
        
        this.logger.log(
          `${method} ${url} ${statusCode} - ${duration}ms`,
          'HTTP',
          { method, url, statusCode, duration, userAgent, ip }
        )
      })
    )
  }
}
```

Apply the interceptor globally:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { LoggerModule } from './common/logger/logger.module'

@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor
    }
  ]
})
export class AppModule {}
```

## Exception Filters

Create exception filters with logging:

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { PlipLoggerService } from '../logger/plip-logger.service'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PlipLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message = 
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    const errorLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      stack: exception instanceof Error ? exception.stack : undefined
    }

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${errorLog.message}`,
        errorLog.stack,
        'ExceptionFilter'
      )
    } else {
      this.logger.warn(
        `HTTP ${status} Error: ${errorLog.message}`,
        'ExceptionFilter'
      )
    }

    response.status(status).json({
      statusCode: status,
      timestamp: errorLog.timestamp,
      path: errorLog.path,
      message: errorLog.message
    })
  }
}
```

Register the exception filter:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PlipLoggerService } from './common/logger/plip-logger.service'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  
  const logger = app.get(PlipLoggerService)
  app.useLogger(logger)
  app.useGlobalFilters(new HttpExceptionFilter(logger))

  await app.listen(3000)
}

bootstrap()
```

## Decorators

Create custom logging decorators:

```typescript
// src/common/decorators/log-execution.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const LOG_EXECUTION_KEY = 'logExecution'
export const LogExecution = (level: 'debug' | 'info' | 'warn' = 'debug') => 
  SetMetadata(LOG_EXECUTION_KEY, level)
```

Create an interceptor for the decorator:

```typescript
// src/common/interceptors/log-execution.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PlipLoggerService } from '../logger/plip-logger.service'
import { LOG_EXECUTION_KEY } from '../decorators/log-execution.decorator'

@Injectable()
export class LogExecutionInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PlipLoggerService,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logLevel = this.reflector.get<string>(
      LOG_EXECUTION_KEY,
      context.getHandler()
    )

    if (!logLevel) {
      return next.handle()
    }

    const className = context.getClass().name
    const methodName = context.getHandler().name
    const start = Date.now()

    this.logger[logLevel](`Executing ${className}.${methodName}`, 'ExecutionLogger')

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start
        this.logger[logLevel](
          `Completed ${className}.${methodName} in ${duration}ms`,
          'ExecutionLogger'
        )
      })
    )
  }
}
```

Use the decorator:

```typescript
// src/users/users.controller.ts
import { Controller, Get } from '@nestjs/common'
import { LogExecution } from '../common/decorators/log-execution.decorator'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @LogExecution('info')
  async findAll() {
    return this.usersService.findAll()
  }

  @Get('slow-operation')
  @LogExecution('warn')
  async slowOperation() {
    // This will log at warn level due to the decorator
    return this.usersService.performSlowOperation()
  }
}
```

## Middleware

Create logging middleware:

```typescript
// src/common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { PlipLoggerService } from '../logger/plip-logger.service'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: PlipLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl: url, ip, headers } = req
    const userAgent = headers['user-agent'] || ''
    const start = Date.now()

    this.logger.log(
      `${method} ${url} - ${ip}`,
      'HTTP',
      { method, url, ip, userAgent }
    )

    res.on('finish', () => {
      const { statusCode } = res
      const duration = Date.now() - start
      
      this.logger.log(
        `${method} ${url} ${statusCode} - ${duration}ms`,
        'HTTP',
        { method, url, statusCode, duration, ip, userAgent }
      )
    })

    next()
  }
}
```

Apply the middleware:

```typescript
// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { LoggerMiddleware } from './common/middleware/logger.middleware'

@Module({
  // ... other configuration
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*')
  }
}
```

## Guards with Logging

Create guards that log authentication attempts:

```typescript
// src/common/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common'
import { PlipLoggerService } from '../logger/plip-logger.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly logger: PlipLoggerService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.authorization

    if (!token) {
      this.logger.warn(
        `Unauthorized access attempt to ${request.url}`,
        'AuthGuard',
        { url: request.url, ip: request.ip }
      )
      throw new UnauthorizedException('Access token required')
    }

    try {
      // Validate token logic here
      const isValid = this.validateToken(token)
      
      if (isValid) {
        this.logger.debug(
          `Successful authentication for ${request.url}`,
          'AuthGuard',
          { url: request.url, ip: request.ip }
        )
        return true
      } else {
        this.logger.warn(
          `Invalid token used for ${request.url}`,
          'AuthGuard',
          { url: request.url, ip: request.ip }
        )
        throw new UnauthorizedException('Invalid access token')
      }
    } catch (error) {
      this.logger.error(
        `Authentication error for ${request.url}`,
        error.stack,
        'AuthGuard'
      )
      throw new UnauthorizedException('Authentication failed')
    }
  }

  private validateToken(token: string): boolean {
    // Token validation logic
    return true // Simplified for example
  }
}
```

## Configuration

Use ConfigModule for environment-based logger configuration:

```typescript
// src/config/logger.config.ts
import { registerAs } from '@nestjs/config'

export default registerAs('logger', () => ({
  enabledLevels: process.env.LOG_LEVELS?.split(',') ?? ['info', 'warn', 'error', 'success'],
  enableColors: process.env.NODE_ENV !== 'production',
  enableTimestamp: true,
  enableStructuredOutput: process.env.NODE_ENV === 'production'
}))
```

Update the logger service:

```typescript
// src/common/logger/plip-logger.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createPlip, type Logger } from '@ru-dr/plip'

@Injectable()
export class PlipLoggerService {
  private logger: Logger

  constructor(private configService: ConfigService) {
    this.logger = createPlip({
      enabledLevels: this.configService.get('logger.enabledLevels'),
      enableColors: this.configService.get('logger.enableColors'),
      enableTimestamp: this.configService.get('logger.enableTimestamp'),
      enableStructuredOutput: this.configService.get('logger.enableStructuredOutput')
    })
  }

  // ... rest of the methods
}
```

## Testing

Test your logging integration:

```typescript
// src/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { PlipLoggerService } from '../common/logger/plip-logger.service'

describe('UsersController', () => {
  let controller: UsersController
  let loggerService: PlipLoggerService

  beforeEach(async () => {
    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([])
          }
        },
        {
          provide: PlipLoggerService,
          useValue: mockLoggerService
        }
      ]
    }).compile()

    controller = module.get<UsersController>(UsersController)
    loggerService = module.get<PlipLoggerService>(PlipLoggerService)
  })

  it('should log when finding all users', async () => {
    await controller.findAll()
    
    expect(loggerService.log).toHaveBeenCalledWith(
      'Fetching all users',
      'UsersController'
    )
  })
})
```

## Best Practices

1. **Use Context**: Always include context in your log messages to identify the source
2. **Structured Logging**: Include relevant metadata for better log analysis
3. **Error Handling**: Log errors with stack traces for debugging
4. **Performance Monitoring**: Track execution times for critical operations
5. **Security**: Avoid logging sensitive information like passwords or tokens
6. **Environment Configuration**: Use different log levels for different environments
7. **Testing**: Mock the logger service in your unit tests

## Examples

Check out our [NestJS examples repository](https://github.com/ru-dr/plip/tree/main/examples/nestjs) for complete working examples including:

- Complete application setup with logging
- Custom decorators and interceptors
- Error handling and exception filters
- Authentication guards with logging
- Performance monitoring implementation
