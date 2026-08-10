# Database Integration

This guide covers integrating Plip Logger with various databases and ORMs to provide comprehensive logging for database operations.

## Prisma Integration

### Setup

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true,
  enableColors: process.env.NODE_ENV === 'development'
})

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' }
  ]
})

// Log Prisma events
prisma.$on('query', (e) => {
  logger.debug('Database Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    target: e.target
  })
})

prisma.$on('error', (e) => {
  logger.error('Database Error', {
    message: e.message,
    target: e.target
  })
})

prisma.$on('info', (e) => {
  logger.info('Database Info', {
    message: e.message,
    target: e.target
  })
})

prisma.$on('warn', (e) => {
  logger.warn('Database Warning', {
    message: e.message,
    target: e.target
  })
})
```

### Query Logging with Performance Tracking

```typescript
// lib/database-logger.ts
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

export async function loggedQuery<T>(
  operation: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = Date.now()
  
  logger.debug(`Starting ${operation}`, metadata)

  try {
    const result = await queryFn()
    const duration = Date.now() - start
    
    logger.info(`${operation} completed`, {
      ...metadata,
      duration: `${duration}ms`,
      success: true
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    
    logger.error(`${operation} failed`, {
      ...metadata,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    })
    
    throw error
  }
}

// Usage example
export async function getUserById(id: number) {
  return loggedQuery(
    'getUserById',
    () => prisma.user.findUnique({ where: { id } }),
    { userId: id }
  )
}

export async function createUser(data: CreateUserData) {
  return loggedQuery(
    'createUser',
    () => prisma.user.create({ data }),
    { userEmail: data.email }
  )
}
```

## TypeORM Integration

### Setup with Logging

```typescript
// config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV === 'development',
  logging: ['error', 'warn', 'migration'],
  logger: {
    logQuery: (query: string, parameters?: any[]) => {
      logger.debug('Database Query', {
        query: query.replace(/\s+/g, ' ').trim(),
        parameters
      })
    },
    logQueryError: (error: string, query: string, parameters?: any[]) => {
      logger.error('Database Query Error', {
        error,
        query: query.replace(/\s+/g, ' ').trim(),
        parameters
      })
    },
    logQuerySlow: (time: number, query: string, parameters?: any[]) => {
      logger.warn('Slow Database Query', {
        duration: `${time}ms`,
        query: query.replace(/\s+/g, ' ').trim(),
        parameters
      })
    },
    logSchemaBuild: (message: string) => {
      logger.info('Database Schema', { message })
    },
    logMigration: (message: string) => {
      logger.info('Database Migration', { message })
    },
    log: (level: 'log' | 'info' | 'warn', message: string) => {
      const logLevel = level === 'log' ? 'info' : level
      logger[logLevel]('Database Log', { message })
    }
  }
}
```

### Repository with Logging

```typescript
// repositories/user.repository.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { createPlip } from '@ru-dr/plip'

@Injectable()
export class UserRepository {
  private logger = createPlip({
    enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
    enableTimestamp: true
  })

  constructor(
    @InjectRepository(User)
    private repository: Repository<User>
  ) {}

  async findAll(): Promise<User[]> {
    this.logger.debug('Fetching all users from database')
    
    try {
      const start = Date.now()
      const users = await this.repository.find()
      const duration = Date.now() - start
      
      this.logger.info('Users fetched successfully', {
        count: users.length,
        duration: `${duration}ms`
      })
      
      return users
    } catch (error) {
      this.logger.error('Failed to fetch users', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  async findById(id: number): Promise<User | null> {
    this.logger.debug(`Fetching user by ID: ${id}`)
    
    try {
      const start = Date.now()
      const user = await this.repository.findOne({ where: { id } })
      const duration = Date.now() - start
      
      if (user) {
        this.logger.debug('User found', {
          userId: id,
          duration: `${duration}ms`
        })
      } else {
        this.logger.warn('User not found', {
          userId: id,
          duration: `${duration}ms`
        })
      }
      
      return user
    } catch (error) {
      this.logger.error(`Failed to fetch user ${id}`, {
        userId: id,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    this.logger.debug('Creating new user', {
      email: userData.email
    })
    
    try {
      const start = Date.now()
      const user = this.repository.create(userData)
      const savedUser = await this.repository.save(user)
      const duration = Date.now() - start
      
      this.logger.info('User created successfully', {
        userId: savedUser.id,
        email: savedUser.email,
        duration: `${duration}ms`
      })
      
      return savedUser
    } catch (error) {
      this.logger.error('Failed to create user', {
        email: userData.email,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }
}
```

## Mongoose Integration

### Setup with Logging

```typescript
// config/mongoose.config.ts
import mongoose from 'mongoose'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

// Enable mongoose debugging
mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any) => {
  logger.debug('MongoDB Operation', {
    collection: collectionName,
    method,
    query: JSON.stringify(query),
    document: doc ? JSON.stringify(doc) : undefined
  })
})

// Connection event logging
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected successfully')
})

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', {
    error: error.message,
    stack: error.stack
  })
})

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

export async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('MongoDB connection established')
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}
```

### Schema with Logging Middleware

```typescript
// models/user.model.ts
import mongoose, { Schema, Document } from 'mongoose'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

export interface IUser extends Document {
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Pre-save middleware with logging
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  
  if (this.isNew) {
    logger.debug('Creating new user document', {
      email: this.email,
      name: this.name
    })
  } else {
    logger.debug('Updating user document', {
      userId: this._id,
      email: this.email,
      modifiedPaths: this.modifiedPaths()
    })
  }
  
  next()
})

// Post-save middleware with logging
UserSchema.post('save', function(doc) {
  if (this.wasNew) {
    logger.info('User document created', {
      userId: doc._id,
      email: doc.email
    })
  } else {
    logger.info('User document updated', {
      userId: doc._id,
      email: doc.email
    })
  }
})

// Pre-remove middleware with logging
UserSchema.pre('remove', function(next) {
  logger.debug('Removing user document', {
    userId: this._id,
    email: this.email
  })
  next()
})

// Post-remove middleware with logging
UserSchema.post('remove', function(doc) {
  logger.info('User document removed', {
    userId: doc._id,
    email: doc.email
  })
})

export const User = mongoose.model<IUser>('User', UserSchema)
```

### Service with Query Logging

```typescript
// services/user.service.ts
import { User, IUser } from '../models/user.model'
import { createPlip } from '@ru-dr/plip'

export class UserService {
  private logger = createPlip({
    enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
    enableTimestamp: true
  })

  async findAll(): Promise<IUser[]> {
    this.logger.debug('Fetching all users from MongoDB')
    
    try {
      const start = Date.now()
      const users = await User.find()
      const duration = Date.now() - start
      
      this.logger.info('Users fetched successfully', {
        count: users.length,
        duration: `${duration}ms`
      })
      
      return users
    } catch (error) {
      this.logger.error('Failed to fetch users', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  async findById(id: string): Promise<IUser | null> {
    this.logger.debug(`Fetching user by ID: ${id}`)
    
    try {
      const start = Date.now()
      const user = await User.findById(id)
      const duration = Date.now() - start
      
      if (user) {
        this.logger.debug('User found', {
          userId: id,
          duration: `${duration}ms`
        })
      } else {
        this.logger.warn('User not found', {
          userId: id,
          duration: `${duration}ms`
        })
      }
      
      return user
    } catch (error) {
      this.logger.error(`Failed to fetch user ${id}`, {
        userId: id,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    this.logger.debug('Creating new user', {
      email: userData.email
    })
    
    try {
      const start = Date.now()
      const user = new User(userData)
      const savedUser = await user.save()
      const duration = Date.now() - start
      
      this.logger.info('User created successfully', {
        userId: savedUser._id,
        email: savedUser.email,
        duration: `${duration}ms`
      })
      
      return savedUser
    } catch (error) {
      this.logger.error('Failed to create user', {
        email: userData.email,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }
}
```

## Sequelize Integration

### Setup with Logging

```typescript
// config/sequelize.config.ts
import { Sequelize } from 'sequelize'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: (sql: string, timing?: number) => {
      logger.debug('Database Query', {
        sql: sql.replace(/\s+/g, ' ').trim(),
        timing: timing ? `${timing}ms` : undefined
      })
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

// Connection event logging
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection established successfully')
  })
  .catch((error) => {
    logger.error('Unable to connect to database', {
      error: error.message,
      stack: error.stack
    })
  })
```

### Model with Hooks

```typescript
// models/user.model.ts
import { DataTypes, Model, Sequelize } from 'sequelize'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

export class User extends Model {
  public id!: number
  public email!: string
  public name!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users'
    }
  )

  // Hooks for logging
  User.addHook('beforeCreate', (user: User) => {
    logger.debug('Creating new user', {
      email: user.email,
      name: user.name
    })
  })

  User.addHook('afterCreate', (user: User) => {
    logger.info('User created successfully', {
      userId: user.id,
      email: user.email
    })
  })

  User.addHook('beforeUpdate', (user: User) => {
    logger.debug('Updating user', {
      userId: user.id,
      email: user.email,
      changed: user.changed()
    })
  })

  User.addHook('afterUpdate', (user: User) => {
    logger.info('User updated successfully', {
      userId: user.id,
      email: user.email
    })
  })

  User.addHook('beforeDestroy', (user: User) => {
    logger.debug('Deleting user', {
      userId: user.id,
      email: user.email
    })
  })

  User.addHook('afterDestroy', (user: User) => {
    logger.info('User deleted successfully', {
      userId: user.id,
      email: user.email
    })
  })

  return User
}
```

## Connection Pool Monitoring

### Monitor Database Connections

```typescript
// utils/connection-monitor.ts
import { createPlip } from '@ru-dr/plip'

export class ConnectionMonitor {
  private logger = createPlip({
    enabledLevels: ['info', 'warn', 'error', 'success'],
    enableTimestamp: true
  })

  private activeConnections = 0
  private maxConnections = 0
  private totalConnections = 0

  trackConnection() {
    this.activeConnections++
    this.totalConnections++
    
    if (this.activeConnections > this.maxConnections) {
      this.maxConnections = this.activeConnections
    }

    this.logger.debug('Database connection opened', {
      active: this.activeConnections,
      total: this.totalConnections,
      max: this.maxConnections
    })
  }

  releaseConnection() {
    this.activeConnections--
    
    this.logger.debug('Database connection closed', {
      active: this.activeConnections,
      total: this.totalConnections,
      max: this.maxConnections
    })
  }

  logStats() {
    this.logger.info('Connection pool statistics', {
      active: this.activeConnections,
      total: this.totalConnections,
      max: this.maxConnections
    })
  }

  startPeriodicLogging(intervalMs = 60000) {
    setInterval(() => {
      this.logStats()
    }, intervalMs)
  }
}

export const connectionMonitor = new ConnectionMonitor()
```

## Transaction Logging

### Prisma Transaction Logging

```typescript
// utils/transaction-logger.ts
import { PrismaClient } from '@prisma/client'
import { createPlip } from '@ru-dr/plip'

const logger = createPlip({
  enabledLevels: ['debug', 'info', 'warn', 'error', 'success'],
  enableTimestamp: true
})

export async function loggedTransaction<T>(
  prisma: PrismaClient,
  operations: (tx: PrismaClient) => Promise<T>,
  context?: string
): Promise<T> {
  const transactionId = Math.random().toString(36).substr(2, 9)
  const start = Date.now()
  
  logger.info('Transaction started', {
    transactionId,
    context
  })

  try {
    const result = await prisma.$transaction(async (tx) => {
      logger.debug('Executing transaction operations', {
        transactionId,
        context
      })
      
      return await operations(tx)
    })

    const duration = Date.now() - start
    
    logger.info('Transaction completed successfully', {
      transactionId,
      context,
      duration: `${duration}ms`
    })

    return result
  } catch (error) {
    const duration = Date.now() - start
    
    logger.error('Transaction failed', {
      transactionId,
      context,
      duration: `${duration}ms`,
      error: error.message,
      stack: error.stack
    })

    throw error
  }
}

// Usage example
export async function transferFunds(fromUserId: number, toUserId: number, amount: number) {
  return loggedTransaction(
    prisma,
    async (tx) => {
      // Debit from source account
      await tx.account.update({
        where: { userId: fromUserId },
        data: { balance: { decrement: amount } }
      })

      // Credit to destination account
      await tx.account.update({
        where: { userId: toUserId },
        data: { balance: { increment: amount } }
      })

      // Create transaction record
      return await tx.transaction.create({
        data: {
          fromUserId,
          toUserId,
          amount,
          type: 'TRANSFER'
        }
      })
    },
    `transfer-${fromUserId}-to-${toUserId}`
  )
}
```

## Best Practices

1. **Performance Monitoring**: Log query execution times to identify slow queries
2. **Connection Monitoring**: Track database connection pool usage
3. **Error Handling**: Log database errors with context for debugging
4. **Transaction Logging**: Monitor transaction success and failure rates
5. **Security**: Avoid logging sensitive data like passwords or tokens
6. **Structured Data**: Include relevant metadata for better log analysis
7. **Log Levels**: Use appropriate log levels for different types of operations
8. **Query Optimization**: Use logged query data to identify optimization opportunities

## Troubleshooting

### Common Issues

**High log volume from database queries:**
- Adjust log level to reduce verbosity
- Implement query sampling for high-traffic operations
- Use conditional logging based on query duration

**Missing transaction context:**
- Ensure transaction IDs are propagated through your application
- Use correlation IDs to trace related operations
- Include user context in transaction logs

**Performance impact:**
- Monitor logging overhead on database operations
- Consider async logging for high-throughput applications
- Use structured logging for better performance

**Log storage growth:**
- Implement log rotation and archival strategies
- Consider log aggregation services for large applications
- Set up alerts for unusual database activity patterns

This comprehensive database integration guide provides patterns for all major database systems and ORMs, ensuring you can monitor and debug your database operations effectively with Plip Logger.
