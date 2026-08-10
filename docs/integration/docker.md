# Docker & CI/CD Integration

This guide covers integrating Plip Logger with Docker containers and CI/CD pipelines for comprehensive logging in deployed applications.

## Docker Integration

### Basic Dockerfile with Logging

```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables for logging
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check with logging
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
```

### Multi-stage Docker Build

```dockerfile
# Dockerfile.multistage
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json
ENV LOG_TIMESTAMP=true

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership
RUN chown -R appuser:nodejs /app

USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

### Application Configuration for Docker

```typescript
// src/config/docker.ts
import { createPlip, levelsAtOrAbove, type Logger, type LogLevel } from '@ru-dr/plip'

// Plip itself does not read LOG_LEVEL — this is your own glue code.
// `levelsAtOrAbove` is exported by Plip and follows its severity ranking.
function levelsFrom(minLevel = 'info'): LogLevel[] {
  return levelsAtOrAbove(minLevel as LogLevel)
}

export function createDockerLogger(): Logger {
  return createPlip({
    enabledLevels: levelsFrom(process.env.LOG_LEVEL),
    enableTimestamp: process.env.LOG_TIMESTAMP === 'true',
    enableColors: false, // Disable colors in containers
    // One JSON object per line, for container log collectors
    enableStructuredOutput: (process.env.LOG_FORMAT || 'json') === 'json'
  })
}

// Enhanced Docker logger with container metadata
export function createEnhancedDockerLogger(): Logger {
  const logger = createPlip({
    enabledLevels: levelsFrom(process.env.LOG_LEVEL),
    enableTimestamp: true,
    enableColors: false,
    enableStructuredOutput: true
  })

  // Add container metadata to all logs
  const originalMethods = ['info', 'error', 'warn', 'debug']
  
  originalMethods.forEach(method => {
    const original = logger[method].bind(logger)
    logger[method] = (message: string, data: any = {}) => {
      return original(message, {
        ...data,
        container: {
          id: process.env.HOSTNAME, // Container ID in most orchestrators
          image: process.env.DOCKER_IMAGE,
          version: process.env.APP_VERSION,
          environment: process.env.NODE_ENV
        }
      })
    }
  })

  return logger
}
```

### Docker Compose with Logging

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - LOG_FORMAT=json
      - LOG_TIMESTAMP=true
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
      - redis
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Log aggregation service
  fluentd:
    image: fluent/fluentd:v1.16-1
    ports:
      - "24224:24224"
    volumes:
      - ./fluentd/fluent.conf:/fluentd/etc/fluent.conf
      - /var/log:/var/log
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

volumes:
  postgres_data:
```

### Development Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - LOG_FORMAT=pretty
      - LOG_TIMESTAMP=true
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
    command: npm run dev

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp_dev
      - POSTGRES_USER=dev
      - POSTGRES_PASSWORD=dev
    ports:
      - "5432:5432"
    volumes:
      - dev_postgres_data:/var/lib/postgresql/data

volumes:
  dev_postgres_data:
```

## Kubernetes Integration

### Deployment with Logging Configuration

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plip-app
  labels:
    app: plip-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: plip-app
  template:
    metadata:
      labels:
        app: plip-app
    spec:
      containers:
      - name: app
        image: your-registry/plip-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        - name: LOG_FORMAT
          value: "json"
        - name: LOG_TIMESTAMP
          value: "true"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### ConfigMap for Logging Configuration

```yaml
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: plip-app-config
data:
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  LOG_TIMESTAMP: "true"
  DATABASE_LOG_LEVEL: "warn"
  HTTP_LOG_LEVEL: "info"
```

### Service and Ingress

```yaml
# k8s/service.yml
apiVersion: v1
kind: Service
metadata:
  name: plip-app-service
spec:
  selector:
    app: plip-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: plip-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: plip-app-service
            port:
              number: 80
```

### Enhanced Kubernetes Logger

```typescript
// src/config/kubernetes.ts
import { createPlip, type Logger } from '@ru-dr/plip'
import { levelsFrom } from './docker'

export function createKubernetesLogger(): Logger {
  const logger = createPlip({
    enabledLevels: levelsFrom(process.env.LOG_LEVEL),
    enableTimestamp: true,
    enableColors: false,
    enableStructuredOutput: true
  })

  // Add Kubernetes metadata to all logs
  const k8sMetadata = {
    pod: {
      name: process.env.POD_NAME,
      namespace: process.env.POD_NAMESPACE,
      node: process.env.NODE_NAME
    },
    container: {
      name: process.env.CONTAINER_NAME,
      image: process.env.CONTAINER_IMAGE
    }
  }

  const originalMethods = ['info', 'error', 'warn', 'debug']
  
  originalMethods.forEach(method => {
    const original = logger[method].bind(logger)
    logger[method] = (message: string, data: any = {}) => {
      return original(message, {
        ...data,
        kubernetes: k8sMetadata
      })
    }
  })

  return logger
}
```

## CI/CD Pipeline Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

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
    
    - name: Run tests with logging
      run: npm test
      env:
        LOG_LEVEL: error
        CI: true
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        LOG_LEVEL: info
        TEST_LOG_FORMAT: json

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        build-args: |
          LOG_LEVEL=info
          NODE_ENV=production

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Kubernetes
      run: |
        echo "Deploying to Kubernetes cluster..."
        # kubectl commands here
      env:
        KUBECONFIG: ${{ secrets.KUBECONFIG }}
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

before_script:
  - echo "Setting up logging configuration"

test:
  stage: test
  image: node:18-alpine
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run test
  variables:
    LOG_LEVEL: "error"
    TEST_LOG_FORMAT: "json"
  artifacts:
    reports:
      junit: test-results.xml
    when: always

build:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
  script:
    - docker build --build-arg LOG_LEVEL=info --build-arg NODE_ENV=production -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main

deploy:
  stage: deploy
  image: alpine/helm:latest
  script:
    - helm upgrade --install plip-app ./helm-chart 
      --set image.tag=$CI_COMMIT_SHA 
      --set logging.level=info 
      --set logging.format=json
  environment:
    name: production
    url: https://app.example.com
  only:
    - main
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = 'plip-app'
        LOG_LEVEL = 'info'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test') {
            steps {
                script {
                    sh 'npm ci'
                    sh 'LOG_LEVEL=error npm test'
                    sh 'LOG_LEVEL=info npm run test:integration'
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'test-results.xml'
                }
            }
        }
        
        stage('Build') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}", 
                        "--build-arg LOG_LEVEL=${LOG_LEVEL} --build-arg NODE_ENV=production .")
                    
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh """
                        kubectl set image deployment/plip-app app=${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        kubectl rollout status deployment/plip-app
                    """
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Build failed. Check console output for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

## Log Aggregation and Monitoring

### Fluentd Configuration

```ruby
# fluentd/fluent.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<filter docker.**>
  @type parser
  key_name log
  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%dT%H:%M:%S.%LZ
  </parse>
</filter>

<match docker.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix plip-app
  logstash_dateformat %Y.%m.%d
  include_tag_key true
  type_name _doc
  tag_key @log_name
  flush_interval 1s
</match>
```

### Promtail Configuration for Loki

```yaml
# promtail/config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/log/containers/*.log

    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          source: attrs
          expressions:
            tag: attrs.tag
      - regex:
          source: tag
          expression: '^(?P<container_name>(?:[^_]+_){2}(?P<pod_name>[^_]+))'
      - timestamp:
          source: time
          format: RFC3339Nano
```

## Health Checks with Logging

### Express.js Health Check

```typescript
// src/routes/health.ts
import { Router } from 'express'
import { createPlip } from '@ru-dr/plip'

const router = Router()
const logger = createPlip({
  enabledLevels: ['info', 'success', 'warn', 'error'],
  enableTimestamp: true
})

router.get('/health', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      redis: false,
      external_api: false
    }
  }

  try {
    // Database health check
    await checkDatabase()
    healthCheck.checks.database = true

    // Redis health check
    await checkRedis()
    healthCheck.checks.redis = true

    // External API health check
    await checkExternalAPI()
    healthCheck.checks.external_api = true

    logger.debug('Health check passed', healthCheck)
    res.status(200).json(healthCheck)
  } catch (error) {
    healthCheck.message = 'DEGRADED'
    
    logger.warn('Health check failed', {
      ...healthCheck,
      error: error.message
    })
    
    res.status(503).json(healthCheck)
  }
})

router.get('/ready', (req, res) => {
  // Readiness check - simpler than health check
  logger.debug('Readiness check requested')
  res.status(200).json({ status: 'ready' })
})

async function checkDatabase(): Promise<void> {
  // Database connection check
}

async function checkRedis(): Promise<void> {
  // Redis connection check
}

async function checkExternalAPI(): Promise<void> {
  // External API check
}

export default router
```

## Best Practices

1. **Container Logging**: Use JSON format and disable colors in containers
2. **Environment Variables**: Configure logging through environment variables
3. **Health Checks**: Include logging in health check endpoints
4. **Resource Limits**: Set appropriate resource limits for logging overhead
5. **Log Aggregation**: Use centralized logging solutions for production
6. **Security**: Avoid logging sensitive information in container logs
7. **Performance**: Monitor logging impact on application performance
8. **Monitoring**: Set up alerts for error rates and performance metrics

## Troubleshooting

### Common Issues

**Container logs not appearing:**
- Check Docker logging driver configuration
- Verify log format is compatible with log aggregation system
- Ensure container has write permissions to log files

**High log volume in containers:**
- Adjust log levels for production environments
- Implement log sampling for high-traffic applications
- Configure log rotation and retention policies

**Performance impact:**
- Monitor CPU and memory usage of logging
- Use asynchronous logging where possible
- Consider batching log messages for better performance

**CI/CD pipeline failures:**
- Check environment variable configuration
- Verify Docker build arguments are correct
- Ensure test logging doesn't interfere with CI systems

This comprehensive Docker and CI/CD integration guide ensures you can effectively deploy and monitor your applications with Plip Logger across different environments and orchestration platforms.
