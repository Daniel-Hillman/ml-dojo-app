# Production Deployment Guide

This guide covers deploying the Live Code Execution System to production with proper monitoring, feature flags, and maintenance procedures.

## Pre-Deployment Checklist

### Security Review
- [ ] All execution engines are properly sandboxed
- [ ] Resource limits are configured appropriately
- [ ] Content Security Policy (CSP) headers are set
- [ ] Input validation is comprehensive
- [ ] Network access is properly restricted
- [ ] Error messages don't expose sensitive information

### Performance Testing
- [ ] Load testing completed for expected traffic
- [ ] Memory usage is within acceptable limits
- [ ] Execution timeouts are properly configured
- [ ] Concurrent execution limits are set
- [ ] Cache strategies are implemented

### Monitoring Setup
- [ ] Production monitoring is configured
- [ ] Alerting thresholds are set
- [ ] Health checks are implemented
- [ ] Log aggregation is working
- [ ] Performance metrics collection is active

### Feature Flags
- [ ] Feature flags are configured for gradual rollout
- [ ] A/B testing variants are defined
- [ ] Rollback mechanisms are in place
- [ ] User segmentation is configured

## Deployment Architecture

### Infrastructure Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   Monitoring    │
│                 │    │                 │    │                 │
│ - SSL/TLS       │    │ - Next.js App   │    │ - Metrics       │
│ - Rate Limiting │    │ - Code Execution│    │ - Alerts        │
│ - Health Checks │    │ - Session Mgmt  │    │ - Dashboards    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │    Database     │    │     Cache       │    │   File Storage  │
         │                 │    │                 │    │                 │
         │ - User Data     │    │ - Sessions      │    │ - Code Snippets │
         │ - Execution Log │    │ - Results       │    │ - Uploads       │
         │ - Analytics     │    │ - Feature Flags │    │ - Backups       │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Environment Configuration

#### Production Environment Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Code Execution Limits
NEXT_PUBLIC_CODE_EXECUTION_TIMEOUT=30000
NEXT_PUBLIC_MAX_MEMORY_USAGE=100MB
NEXT_PUBLIC_MAX_CONCURRENT_EXECUTIONS=10
NEXT_PUBLIC_ENABLE_PYTHON_EXECUTION=true
NEXT_PUBLIC_ENABLE_SQL_EXECUTION=true

# Security
NEXT_PUBLIC_CSP_ENABLED=true
NEXT_PUBLIC_SANDBOX_MODE=strict
NEXT_PUBLIC_NETWORK_ACCESS_BLOCKED=true

# Monitoring
NEXT_PUBLIC_MONITORING_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ERROR_REPORTING_ENABLED=true

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true
NEXT_PUBLIC_FEATURE_FLAGS_CACHE_TTL=300000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Cache
REDIS_URL=redis://host:6379
REDIS_TIMEOUT=5000
REDIS_MAX_RETRIES=3

# File Storage
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Alerts
SLACK_WEBHOOK_URL=your-slack-webhook
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-key
```

## Deployment Steps

### 1. Infrastructure Setup

#### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. Monitoring Setup

#### Initialize Production Monitoring

```typescript
// src/lib/code-execution/production-setup.ts
import { productionMonitor } from './production-monitoring';
import { featureFlags } from './feature-flags';
import { userFeedbackManager } from './user-feedback';
import { maintenanceManager } from './maintenance-procedures';

export function initializeProductionSystems() {
  console.log('🚀 Initializing production systems...');

  // Configure monitoring
  productionMonitor.recordExecution({
    timestamp: Date.now(),
    executionId: 'system-startup',
    language: 'system',
    duration: 0,
    success: true,
    memoryUsage: 0,
    codeSize: 0,
    sessionId: 'startup'
  });

  // Initialize feature flags
  console.log('✅ Feature flags initialized');

  // Start user feedback collection
  console.log('✅ User feedback system started');

  // Start maintenance procedures
  console.log('✅ Maintenance procedures started');

  console.log('🎉 Production systems initialized successfully');
}

// Health check endpoint
export function getSystemHealth() {
  const monitorHealth = productionMonitor.getHealthStatus();
  const maintenanceHealth = maintenanceManager.getSystemHealth();
  
  return {
    status: monitorHealth.status === 'healthy' && maintenanceHealth.overall === 'healthy' 
      ? 'healthy' : 'degraded',
    timestamp: Date.now(),
    components: {
      monitoring: monitorHealth,
      maintenance: maintenanceHealth,
      featureFlags: {
        status: 'healthy',
        totalFlags: featureFlags.getAllFlags().length
      },
      feedback: {
        status: 'healthy',
        totalFeedback: userFeedbackManager.getAllFeedback().length
      }
    }
  };
}
```

### 3. Feature Flag Configuration

#### Production Feature Flags

```typescript
// Configure production feature flags
featureFlags.updateFlag('enhanced_python_execution', {
  enabled: true,
  rolloutPercentage: 100
});

featureFlags.updateFlag('collaborative_editing', {
  enabled: true,
  rolloutPercentage: 25, // Gradual rollout
  conditions: {
    userGroups: ['beta_testers', 'premium_users']
  }
});

featureFlags.updateFlag('ai_code_suggestions', {
  enabled: true,
  rolloutPercentage: 10, // Limited rollout
  conditions: {
    userGroups: ['premium_users'],
    environment: 'production'
  }
});
```

### 4. Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=execution:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self';";

        # API rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Code execution rate limiting
        location /api/execute {
            limit_req zone=execution burst=10 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 60s;
        }

        # Health check
        location /health {
            proxy_pass http://app/api/health;
            access_log off;
        }

        # Static files
        location /_next/static/ {
            proxy_pass http://app;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # All other requests
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Monitoring and Alerting

### Health Check Endpoint

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSystemHealth } from '@/lib/code-execution/production-setup';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const health = getSystemHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: Date.now()
    });
  }
}
```

### Monitoring Dashboard

```typescript
// pages/admin/monitoring.tsx
import { useEffect, useState } from 'react';
import { productionMonitor } from '@/lib/code-execution/production-monitoring';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      const healthStatus = productionMonitor.getHealthStatus();
      const systemMetrics = productionMonitor.getSystemMetrics();
      
      setHealth(healthStatus);
      setMetrics(systemMetrics);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="monitoring-dashboard">
      <h1>System Monitoring</h1>
      
      <div className="health-status">
        <h2>System Health</h2>
        <div className={`status ${health?.status}`}>
          {health?.status?.toUpperCase()}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Active Executions</h3>
          <div className="metric-value">{metrics?.activeExecutions || 0}</div>
        </div>
        
        <div className="metric-card">
          <h3>Error Rate</h3>
          <div className="metric-value">
            {((metrics?.errorRate || 0) * 100).toFixed(2)}%
          </div>
        </div>
        
        <div className="metric-card">
          <h3>Avg Response Time</h3>
          <div className="metric-value">
            {(metrics?.averageResponseTime || 0).toFixed(0)}ms
          </div>
        </div>
        
        <div className="metric-card">
          <h3>Throughput</h3>
          <div className="metric-value">
            {metrics?.throughput || 0}/min
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Deployment Scripts

### Automated Deployment

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting production deployment..."

# Build and test
echo "📦 Building application..."
npm run build
npm run test

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t live-code-execution:latest .

# Tag for registry
docker tag live-code-execution:latest your-registry/live-code-execution:latest

# Push to registry
echo "📤 Pushing to registry..."
docker push your-registry/live-code-execution:latest

# Deploy to production
echo "🚀 Deploying to production..."
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Wait for health check
echo "🏥 Waiting for health check..."
sleep 30

# Verify deployment
if curl -f http://localhost/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed - rolling back..."
    docker-compose -f docker-compose.prod.yml rollback
    exit 1
fi

echo "🎉 Production deployment complete!"
```

### Database Migration

```bash
#!/bin/bash
# migrate.sh

echo "🗄️ Running database migrations..."

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run db:migrate

# Verify migration
if npm run db:verify; then
    echo "✅ Database migration successful!"
else
    echo "❌ Migration failed - restoring backup..."
    # Restore from backup if needed
    exit 1
fi
```

## Rollback Procedures

### Automated Rollback

```bash
#!/bin/bash
# rollback.sh

echo "🔄 Starting rollback procedure..."

# Get previous version
PREVIOUS_VERSION=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep live-code-execution | sed -n '2p')

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ No previous version found!"
    exit 1
fi

echo "📦 Rolling back to: $PREVIOUS_VERSION"

# Update docker-compose to use previous version
sed -i "s|image: live-code-execution:latest|image: $PREVIOUS_VERSION|g" docker-compose.prod.yml

# Deploy previous version
docker-compose -f docker-compose.prod.yml up -d

# Wait for health check
sleep 30

# Verify rollback
if curl -f http://localhost/health; then
    echo "✅ Rollback successful!"
else
    echo "❌ Rollback failed!"
    exit 1
fi

echo "🎉 Rollback complete!"
```

## Maintenance Procedures

### Scheduled Maintenance

```bash
#!/bin/bash
# maintenance.sh

echo "🔧 Starting scheduled maintenance..."

# Enable maintenance mode
curl -X POST http://localhost/api/admin/maintenance/enable

# Run maintenance tasks
docker exec live-code-execution npm run maintenance:cleanup
docker exec live-code-execution npm run maintenance:optimize

# Update dependencies
docker exec live-code-execution npm update

# Restart services
docker-compose -f docker-compose.prod.yml restart app

# Disable maintenance mode
curl -X POST http://localhost/api/admin/maintenance/disable

echo "✅ Maintenance complete!"
```

## Security Considerations

### Production Security Checklist

- [ ] SSL/TLS certificates are valid and properly configured
- [ ] All secrets are stored in environment variables or secret management
- [ ] Database connections are encrypted
- [ ] API rate limiting is configured
- [ ] CORS policies are restrictive
- [ ] Input validation is comprehensive
- [ ] Error messages don't expose sensitive information
- [ ] Logging doesn't include sensitive data
- [ ] Security headers are properly set
- [ ] Regular security scans are scheduled

### Security Monitoring

```typescript
// Security event monitoring
productionMonitor.recordExecution({
  timestamp: Date.now(),
  executionId: 'security-scan',
  language: 'security',
  duration: 0,
  success: true,
  memoryUsage: 0,
  codeSize: 0,
  sessionId: 'security-monitor'
});
```

## Performance Optimization

### Production Performance Settings

```typescript
// Production performance configuration
const productionConfig = {
  execution: {
    timeout: 30000,
    memoryLimit: 100 * 1024 * 1024,
    concurrentLimit: 10
  },
  caching: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 1000
  },
  monitoring: {
    sampleRate: 1.0, // 100% in production
    metricsRetention: 7 // days
  }
};
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks in execution engines
   - Verify garbage collection is working
   - Monitor concurrent execution limits

2. **Slow Response Times**
   - Check database query performance
   - Verify cache hit rates
   - Monitor network latency

3. **Execution Failures**
   - Check sandbox configuration
   - Verify resource limits
   - Review error logs

### Emergency Procedures

1. **System Overload**
   ```bash
   # Enable emergency mode
   curl -X POST http://localhost/api/admin/emergency/enable
   
   # Scale down non-essential services
   docker-compose -f docker-compose.prod.yml scale app=2
   ```

2. **Security Incident**
   ```bash
   # Disable code execution
   curl -X POST http://localhost/api/admin/execution/disable
   
   # Enable audit logging
   curl -X POST http://localhost/api/admin/audit/enable
   ```

This production deployment guide provides a comprehensive approach to deploying and maintaining the Live Code Execution System in a production environment with proper monitoring, security, and maintenance procedures.