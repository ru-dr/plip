# Basic Usage Examples

Learn Plip through practical examples, from simple logging to complex scenarios.

## Getting Started

### Simple Logging

The most basic way to use Plip:

```typescript
import { plip } from '@ru-dr/plip';

// Simple text messages
plip.info("Application started");
plip.success("User registration completed");
plip.warn("API rate limit approaching");
plip.error("Database connection failed");
```

**Output:**
```
[INFO] Application started
[SUCCESS] User registration completed
[WARN] API rate limit approaching
[ERROR] Database connection failed
```

### Logging with Data

Add context to your logs with the data parameter:

```typescript
// Log objects
plip.info("User logged in", {
  userId: 123,
  email: "alice@example.com",
  loginTime: new Date().toISOString()
});

// Log arrays
plip.info("Processing items", ["item1", "item2", "item3"]);

// Log primitive values
plip.info("Current temperature", 23.5);
plip.info("Is admin user", true);
```

## Real-World Examples

### Web Server Logging

```typescript
import express from 'express';
import { plip } from '@ru-dr/plip';

const app = express();

// Middleware logging
app.use((req, res, next) => {
  plip.info("Incoming request", {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Route logging
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  plip.debug("Fetching user", { userId: id });
  
  try {
    const user = await getUserById(id);
    
    if (!user) {
      plip.warn("User not found", { userId: id });
      return res.status(404).json({ error: 'User not found' });
    }
    
    plip.success("User retrieved successfully", { 
      userId: id, 
      username: user.username 
    });
    
    res.json(user);
  } catch (error) {
    plip.error("Failed to fetch user", {
      userId: id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  plip.success("Server started on port 3000");
});
```

### Database Operations

```typescript
import { plip } from '@ru-dr/plip';

class UserRepository {
  async createUser(userData: any) {
    plip.info("Creating new user", { email: userData.email });
    
    try {
      // Validate input
      plip.debug("Validating user data", userData);
      await this.validateUserData(userData);
      plip.verbose("User data validation passed");
      
      // Check if user exists
      plip.debug("Checking if user already exists");
      const existingUser = await this.findByEmail(userData.email);
      
      if (existingUser) {
        plip.warn("User creation failed - user already exists", {
          email: userData.email
        });
        throw new Error('User already exists');
      }
      
      // Create user
      plip.verbose("Inserting user into database");
      const user = await this.db.users.create(userData);
      
      plip.success("User created successfully", {
        userId: user.id,
        email: user.email,
        createdAt: user.createdAt
      });
      
      return user;
    } catch (error) {
      plip.error("User creation failed", {
        email: userData.email,
        error: error.message
      });
      throw error;
    }
  }
  
  async deleteUser(userId: number) {
    plip.info("Deleting user", { userId });
    
    try {
      const result = await this.db.users.delete(userId);
      
      if (result.affectedRows === 0) {
        plip.warn("Delete operation completed but no user was found", { userId });
      } else {
        plip.success("User deleted successfully", { userId });
      }
      
      return result;
    } catch (error) {
      plip.error("Failed to delete user", { userId, error: error.message });
      throw error;
    }
  }
}
```

### Authentication Service

```typescript
import { plip } from '@ru-dr/plip';

class AuthService {
  async login(email: string, password: string, req: any) {
    const sessionId = generateSessionId();
    
    plip.info("Login attempt started", {
      email,
      sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    try {
      // Rate limiting check
      const rateLimitResult = await this.checkRateLimit(req.ip);
      if (!rateLimitResult.allowed) {
        plip.warn("Login blocked by rate limiting", {
          email,
          ip: req.ip,
          remainingAttempts: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        });
        throw new Error('Too many login attempts');
      }
      
      // Find user
      plip.debug("Looking up user by email");
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        plip.warn("Login failed - user not found", {
          email,
          sessionId,
          ip: req.ip
        });
        throw new Error('Invalid credentials');
      }
      
      // Verify password
      plip.debug("Verifying password");
      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        plip.warn("Login failed - invalid password", {
          userId: user.id,
          email,
          sessionId,
          ip: req.ip
        });
        throw new Error('Invalid credentials');
      }
      
      // Create session
      plip.debug("Creating user session");
      const session = await this.sessionService.create({
        userId: user.id,
        sessionId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      plip.success("Login successful", {
        userId: user.id,
        email: user.email,
        sessionId,
        ip: req.ip
      });
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        session: {
          id: sessionId,
          expiresAt: session.expiresAt
        }
      };
      
    } catch (error) {
      plip.error("Login process failed", {
        email,
        sessionId,
        ip: req.ip,
        error: error.message
      });
      throw error;
    }
  }
  
  async logout(sessionId: string) {
    plip.info("Logout requested", { sessionId });
    
    try {
      await this.sessionService.invalidate(sessionId);
      plip.success("Logout completed", { sessionId });
    } catch (error) {
      plip.error("Logout failed", { sessionId, error: error.message });
      throw error;
    }
  }
}
```

### Background Job Processing

```typescript
import { plip } from '@ru-dr/plip';

class EmailJobProcessor {
  async processEmailQueue() {
    plip.info("Starting email queue processing");
    
    while (true) {
      try {
        const jobs = await this.getNextJobs(10);
        
        if (jobs.length === 0) {
          plip.verbose("No pending email jobs, waiting...");
          await this.sleep(5000);
          continue;
        }
        
        plip.info("Processing email batch", { 
          batchSize: jobs.length,
          jobIds: jobs.map(j => j.id)
        });
        
        for (const job of jobs) {
          await this.processEmailJob(job);
        }
        
        plip.success("Batch processing completed", { 
          processedCount: jobs.length 
        });
        
      } catch (error) {
        plip.error("Email queue processing error", {
          error: error.message,
          stack: error.stack
        });
        
        // Wait before retrying
        await this.sleep(10000);
      }
    }
  }
  
  async processEmailJob(job: EmailJob) {
    const startTime = Date.now();
    
    plip.debug("Processing email job", {
      jobId: job.id,
      recipient: job.recipient,
      template: job.template
    });
    
    try {
      // Validate email data
      plip.verbose("Validating email data", { jobId: job.id });
      await this.validateEmailData(job);
      
      // Render email template
      plip.verbose("Rendering email template", { 
        jobId: job.id, 
        template: job.template 
      });
      const emailContent = await this.renderTemplate(job);
      
      // Send email
      plip.verbose("Sending email", { jobId: job.id });
      const result = await this.emailService.send({
        to: job.recipient,
        subject: emailContent.subject,
        html: emailContent.html
      });
      
      const processingTime = Date.now() - startTime;
      
      plip.success("Email sent successfully", {
        jobId: job.id,
        recipient: job.recipient,
        messageId: result.messageId,
        processingTime: `${processingTime}ms`
      });
      
      // Mark job as completed
      await this.markJobCompleted(job.id);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      plip.error("Email job failed", {
        jobId: job.id,
        recipient: job.recipient,
        error: error.message,
        processingTime: `${processingTime}ms`
      });
      
      // Mark job as failed for retry
      await this.markJobFailed(job.id, error.message);
    }
  }
}
```

### API Client with Logging

```typescript
import axios from 'axios';
import { plip } from '@ru-dr/plip';

class APIClient {
  constructor(private baseURL: string, private apiKey: string) {
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use((config) => {
      const requestId = generateRequestId();
      config.metadata = { requestId, startTime: Date.now() };
      
      plip.debug("API request started", {
        requestId,
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: this.sanitizeHeaders(config.headers)
      });
      
      return config;
    });
    
    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
        const { requestId, startTime } = response.config.metadata;
        const duration = Date.now() - startTime;
        
        plip.success("API request completed", {
          requestId,
          status: response.status,
          duration: `${duration}ms`,
          dataSize: JSON.stringify(response.data).length
        });
        
        return response;
      },
      (error) => {
        const { requestId, startTime } = error.config?.metadata || {};
        const duration = startTime ? Date.now() - startTime : 0;
        
        plip.error("API request failed", {
          requestId,
          status: error.response?.status,
          duration: `${duration}ms`,
          error: error.message,
          url: error.config?.url
        });
        
        return Promise.reject(error);
      }
    );
  }
  
  async getUsers(page = 1, limit = 10) {
    plip.info("Fetching users", { page, limit });
    
    try {
      const response = await axios.get(`${this.baseURL}/users`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      
      plip.info("Users fetched successfully", {
        totalUsers: response.data.total,
        currentPage: page,
        totalPages: response.data.totalPages
      });
      
      return response.data;
    } catch (error) {
      plip.error("Failed to fetch users", {
        page,
        limit,
        error: error.message
      });
      throw error;
    }
  }
  
  private sanitizeHeaders(headers: any) {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = '***';
    }
    return sanitized;
  }
}
```

## Error Handling Patterns

### Try-Catch with Logging

```typescript
async function processUserData(userData: any) {
  plip.info("Starting user data processing", { userId: userData.id });
  
  try {
    // Step 1: Validation
    plip.debug("Validating user data");
    await validateUserData(userData);
    plip.verbose("Validation completed successfully");
    
    // Step 2: Processing
    plip.debug("Processing user data");
    const processedData = await processData(userData);
    plip.verbose("Data processing completed");
    
    // Step 3: Saving
    plip.debug("Saving processed data");
    const result = await saveData(processedData);
    
    plip.success("User data processing completed", {
      userId: userData.id,
      recordsProcessed: result.count
    });
    
    return result;
    
  } catch (error) {
    if (error instanceof ValidationError) {
      plip.warn("User data validation failed", {
        userId: userData.id,
        validationErrors: error.errors
      });
    } else if (error instanceof ProcessingError) {
      plip.error("User data processing failed", {
        userId: userData.id,
        step: error.step,
        error: error.message
      });
    } else {
      plip.error("Unexpected error in user data processing", {
        userId: userData.id,
        error: error.message,
        stack: error.stack
      });
    }
    
    throw error;
  }
}
```

### Graceful Degradation

```typescript
async function getUserProfile(userId: number) {
  plip.info("Fetching user profile", { userId });
  
  let profile = {};
  
  // Try to get basic user info (critical)
  try {
    plip.debug("Fetching basic user info");
    profile.basic = await getUserBasicInfo(userId);
    plip.success("Basic user info retrieved");
  } catch (error) {
    plip.error("Failed to fetch basic user info", {
      userId,
      error: error.message
    });
    throw error; // This is critical, so we fail
  }
  
  // Try to get user preferences (optional)
  try {
    plip.debug("Fetching user preferences");
    profile.preferences = await getUserPreferences(userId);
    plip.success("User preferences retrieved");
  } catch (error) {
    plip.warn("Failed to fetch user preferences, using defaults", {
      userId,
      error: error.message
    });
    profile.preferences = getDefaultPreferences();
  }
  
  // Try to get recent activity (optional)
  try {
    plip.debug("Fetching recent activity");
    profile.activity = await getRecentActivity(userId);
    plip.success("Recent activity retrieved");
  } catch (error) {
    plip.warn("Failed to fetch recent activity", {
      userId,
      error: error.message
    });
    profile.activity = [];
  }
  
  plip.info("User profile compilation completed", {
    userId,
    hasPreferences: !!profile.preferences,
    activityCount: profile.activity?.length || 0
  });
  
  return profile;
}
```

## Performance Monitoring

### Function Timing

```typescript
function withTiming<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const startTime = Date.now();
    
    plip.debug(`Starting ${name}`, { args: args.slice(0, 2) }); // Limit arg logging
    
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.then(
          (value) => {
            const duration = Date.now() - startTime;
            plip.success(`${name} completed`, { duration: `${duration}ms` });
            return value;
          },
          (error) => {
            const duration = Date.now() - startTime;
            plip.error(`${name} failed`, { 
              duration: `${duration}ms`,
              error: error.message
            });
            throw error;
          }
        );
      }
      
      // Handle sync functions
      const duration = Date.now() - startTime;
      plip.success(`${name} completed`, { duration: `${duration}ms` });
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      plip.error(`${name} failed`, { 
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  }) as T;
}

// Usage
const timedProcessData = withTiming(processUserData, 'processUserData');
const result = await timedProcessData(userData);
```

## Next Steps

- Learn about [Custom Loggers](/examples/custom-loggers)
- Explore [Production Setup](/examples/production)
- Check out [Integration](/examples/integration) examples
