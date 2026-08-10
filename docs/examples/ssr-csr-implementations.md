# SSR/CSR Implementation Examples

This document provides practical, copy-paste examples of implementing Plip Logger in various SSR and CSR scenarios.

## Table of Contents

- [Next.js Full-Stack Implementation](#nextjs-full-stack-implementation)
- [Express.js + React SPA](#expressjs--react-spa)
- [NestJS + Angular](#nestjs--angular)
- [Microservices Architecture](#microservices-architecture)

## Next.js Full-Stack Implementation

### Logger Setup

```typescript
// lib/loggers.ts
import { createSSRLogger, createCSRLogger } from '@ru-dr/plip';

// Server-side logger for API routes, middleware, SSR
export const serverLogger = createSSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production' 
    ? ['info', 'warn', 'error'] 
    : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});

// Client-side logger for React components, browser events
export const clientLogger = createCSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'warn', 'error']
    : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});

// Utility for environment detection
export const getLogger = () => {
  return typeof window !== 'undefined' ? clientLogger : serverLogger;
};
```

### API Route Implementation

```typescript
// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serverLogger } from '../../../lib/loggers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const startTime = Date.now();
  
  serverLogger.info('API request started', {
    method: req.method,
    endpoint: `/api/users/${id}`,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });

  try {
    const user = await getUserById(id as string);
    
    if (!user) {
      serverLogger.warn('User not found', { userId: id });
      return res.status(404).json({ error: 'User not found' });
    }

    serverLogger.success('User data retrieved', {
      userId: user.id,
      userName: user.name,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(200).json(user);
  } catch (error) {
    serverLogger.error('Failed to fetch user', {
      userId: id,
      error: error.message,
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Client Component Implementation

```typescript
// components/UserProfile.tsx
'use client';
import { useEffect, useState } from 'react';
import { clientLogger } from '../lib/loggers';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientLogger.info('UserProfile component mounted', { 
      userId,
      timestamp: new Date().toISOString()
    });

    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    const startTime = Date.now();
    
    try {
      clientLogger.debug('Fetching user data', { userId });
      
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      
      clientLogger.success('User data loaded', {
        userId: userData.id,
        userName: userData.name,
        duration: `${Date.now() - startTime}ms`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      clientLogger.error('Failed to load user data', {
        userId,
        error: errorMessage,
        duration: `${Date.now() - startTime}ms`
      });
    } finally {
      setLoading(false);
      clientLogger.debug('Loading state updated', { loading: false });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Server-Side Rendering

```typescript
// pages/users/[id].tsx
import { GetServerSideProps } from 'next';
import { serverLogger } from '../../lib/loggers';
import { UserProfile } from '../../components/UserProfile';

interface UserPageProps {
  user: User | null;
  error?: string;
}

export default function UserPage({ user, error }: UserPageProps) {
  return (
    <div>
      {error ? (
        <div>Error: {error}</div>
      ) : user ? (
        <UserProfile userId={user.id} />
      ) : (
        <div>User not found</div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const startTime = Date.now();
  
  serverLogger.info('SSR: Loading user page', { 
    userId: id,
    userAgent: context.req.headers['user-agent']
  });

  try {
    const user = await getUserById(id as string);
    
    if (!user) {
      serverLogger.warn('SSR: User not found', { 
        userId: id,
        duration: `${Date.now() - startTime}ms`
      });
      
      return {
        props: { user: null, error: 'User not found' }
      };
    }

    serverLogger.success('SSR: User data loaded', {
      userId: user.id,
      duration: `${Date.now() - startTime}ms`
    });

    return {
      props: { user }
    };
  } catch (error) {
    serverLogger.error('SSR: Failed to load user', {
      userId: id,
      error: error.message,
      duration: `${Date.now() - startTime}ms`
    });

    return {
      props: { 
        user: null, 
        error: 'Failed to load user data' 
      }
    };
  }
};
```

## Express.js + React SPA

### Backend (Express.js with SSR Logger)

```typescript
// server/app.ts
import express from 'express';
import cors from 'cors';
import { createSSRLogger } from '@ru-dr/plip';

const app = express();
const logger = createSSRLogger();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  req.requestId = requestId;
  
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'success';
    
    logger[level]('Request completed', {
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
app.get('/api/users', async (req, res) => {
  try {
    logger.debug('Fetching users list', { requestId: req.requestId });
    
    const users = await User.findAll();
    
    logger.success('Users fetched successfully', {
      requestId: req.requestId,
      count: users.length
    });

    res.json(users);
  } catch (error) {
    logger.error('Failed to fetch users', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.success('Server started', {
    port: PORT,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});
```

### Frontend (React SPA with CSR Logger)

```typescript
// src/services/logger.ts
import { createCSRLogger } from '@ru-dr/plip';

export const logger = createCSRLogger({
  enabledLevels: process.env.NODE_ENV === 'production'
    ? ['info', 'warn', 'error']
    : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
});

// src/components/UserList.tsx
import React, { useEffect, useState } from 'react';
import { logger } from '../services/logger';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.info('UserList component mounted');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching users from API');
      
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      setUsers(userData);
      
      logger.success('Users loaded successfully', {
        count: userData.length,
        duration: `${Date.now() - startTime}ms`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      logger.error('Failed to load users', {
        error: errorMessage,
        duration: `${Date.now() - startTime}ms`
      });
    } finally {
      setLoading(false);
      logger.debug('Loading state updated', { loading: false });
    }
  };

  const handleRefresh = () => {
    logger.info('User requested data refresh');
    setLoading(true);
    setError(null);
    fetchUsers();
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Users ({users.length})</h1>
        <button onClick={handleRefresh}>Refresh</button>
      </div>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## NestJS + Angular

### Backend (NestJS with SSR Logger)

```typescript
// src/common/logger/logger.service.ts
import { Injectable } from '@nestjs/common';
import { createSSRLogger } from '@ru-dr/plip';

@Injectable()
export class LoggerService {
  private logger = createSSRLogger({
    enabledLevels: process.env.NODE_ENV === 'production'
      ? ['info', 'warn', 'error']
      : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
  });

  info(message: string, data?: any, context?: string) {
    this.logger.info(message, { ...data, context, timestamp: new Date().toISOString() });
  }

  error(message: string, data?: any, context?: string) {
    this.logger.error(message, { ...data, context, timestamp: new Date().toISOString() });
  }

  warn(message: string, data?: any, context?: string) {
    this.logger.warn(message, { ...data, context, timestamp: new Date().toISOString() });
  }

  debug(message: string, data?: any, context?: string) {
    this.logger.debug(message, { ...data, context, timestamp: new Date().toISOString() });
  }

  success(message: string, data?: any, context?: string) {
    this.logger.success(message, { ...data, context, timestamp: new Date().toISOString() });
  }
}

// src/users/users.controller.ts
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  async findAll() {
    const startTime = Date.now();
    this.logger.info('Fetching all users', {}, 'UsersController');

    try {
      const users = await this.usersService.findAll();
      
      this.logger.success('Users fetched successfully', {
        count: users.length,
        duration: `${Date.now() - startTime}ms`
      }, 'UsersController');

      return users;
    } catch (error) {
      this.logger.error('Failed to fetch users', {
        error: error.message,
        stack: error.stack,
        duration: `${Date.now() - startTime}ms`
      }, 'UsersController');

      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const startTime = Date.now();
    this.logger.info('Fetching user by ID', { userId: id }, 'UsersController');

    try {
      const user = await this.usersService.findOne(id);
      
      this.logger.success('User fetched successfully', {
        userId: id,
        userName: user.name,
        duration: `${Date.now() - startTime}ms`
      }, 'UsersController');

      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user', {
        userId: id,
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      }, 'UsersController');

      throw error;
    }
  }
}
```

### Frontend (Angular with CSR Logger)

```typescript
// src/services/logger.service.ts
import { Injectable } from '@angular/core';
import { createCSRLogger } from '@ru-dr/plip';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logger = createCSRLogger({
    enabledLevels: process.env['NODE_ENV'] === 'production'
      ? ['info', 'warn', 'error']
      : ['verbose', 'debug', 'info', 'success', 'warn', 'error', 'trace']
  });

  info(message: string, data?: any) {
    this.logger.info(message, { ...data, timestamp: new Date().toISOString() });
  }

  error(message: string, data?: any) {
    this.logger.error(message, { ...data, timestamp: new Date().toISOString() });
  }

  warn(message: string, data?: any) {
    this.logger.warn(message, { ...data, timestamp: new Date().toISOString() });
  }

  debug(message: string, data?: any) {
    this.logger.debug(message, { ...data, timestamp: new Date().toISOString() });
  }

  success(message: string, data?: any) {
    this.logger.success(message, { ...data, timestamp: new Date().toISOString() });
  }
}

// src/components/user-list/user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { LoggerService } from '../../services/logger.service';
import { UserService } from '../../services/user.service';

interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.logger.info('UserListComponent initialized');
    this.loadUsers();
  }

  async loadUsers() {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Loading users from API');
      this.loading = true;
      this.error = null;

      this.users = await this.userService.getUsers().toPromise();
      
      this.logger.success('Users loaded successfully', {
        count: this.users.length,
        duration: `${Date.now() - startTime}ms`
      });
    } catch (error) {
      this.error = error.message;
      
      this.logger.error('Failed to load users', {
        error: error.message,
        duration: `${Date.now() - startTime}ms`
      });
    } finally {
      this.loading = false;
      this.logger.debug('Loading state updated', { loading: false });
    }
  }

  onRefresh() {
    this.logger.info('User requested data refresh');
    this.loadUsers();
  }
}
```

## Microservices Architecture

### Service A (User Service)

```typescript
// services/user-service/src/logger.ts
import { createSSRLogger } from '@ru-dr/plip';

export const logger = createSSRLogger({
  // Service-specific context
}).withContext({
  service: 'user-service',
  version: process.env.SERVICE_VERSION || '1.0.0',
  instance: process.env.HOSTNAME || 'unknown'
});

// services/user-service/src/routes/users.ts
import express from 'express';
import { logger } from '../logger';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();
  
  logger.info('User lookup request', {
    userId: id,
    requestId: req.headers['x-request-id']
  });

  try {
    const user = await getUserById(id);
    
    logger.success('User found', {
      userId: id,
      userName: user.name,
      duration: `${Date.now() - startTime}ms`,
      requestId: req.headers['x-request-id']
    });

    res.json(user);
  } catch (error) {
    logger.error('User lookup failed', {
      userId: id,
      error: error.message,
      duration: `${Date.now() - startTime}ms`,
      requestId: req.headers['x-request-id']
    });

    res.status(error.statusCode || 500).json({
      error: error.message
    });
  }
});

export default router;
```

### Service B (Order Service)

```typescript
// services/order-service/src/logger.ts
import { createSSRLogger } from '@ru-dr/plip';

export const logger = createSSRLogger().withContext({
  service: 'order-service',
  version: process.env.SERVICE_VERSION || '1.0.0',
  instance: process.env.HOSTNAME || 'unknown'
});

// services/order-service/src/services/order.service.ts
import { logger } from '../logger';
import { UserServiceClient } from '../clients/user-service';

export class OrderService {
  private userService = new UserServiceClient();

  async createOrder(orderData: CreateOrderRequest) {
    const startTime = Date.now();
    const orderId = crypto.randomUUID();
    
    logger.info('Order creation started', {
      orderId,
      userId: orderData.userId,
      itemCount: orderData.items.length
    });

    try {
      // Validate user exists
      logger.debug('Validating user', { userId: orderData.userId, orderId });
      const user = await this.userService.getUser(orderData.userId);
      
      logger.debug('User validated', { 
        userId: user.id, 
        userName: user.name, 
        orderId 
      });

      // Create order
      const order = await this.createOrderRecord(orderId, orderData);
      
      logger.success('Order created successfully', {
        orderId: order.id,
        userId: order.userId,
        total: order.total,
        duration: `${Date.now() - startTime}ms`
      });

      return order;
    } catch (error) {
      logger.error('Order creation failed', {
        orderId,
        userId: orderData.userId,
        error: error.message,
        stack: error.stack,
        duration: `${Date.now() - startTime}ms`
      });

      throw error;
    }
  }
}
```

This comprehensive collection of examples demonstrates proper SSR/CSR logger usage across different architectural patterns, providing developers with practical implementation guidance for their specific use cases.
