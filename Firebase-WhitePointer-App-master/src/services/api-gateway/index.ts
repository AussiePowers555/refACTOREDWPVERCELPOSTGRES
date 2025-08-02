/**
 * API Gateway Service - Enterprise Microservices Gateway
 * Implements routing, authentication, rate limiting, and circuit breaking
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import CircuitBreaker from 'opossum';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import promBundle from 'express-prom-bundle';

// Service registry configuration
interface ServiceConfig {
  name: string;
  url: string;
  healthCheckUrl: string;
  timeout: number;
  retries: number;
  circuitBreaker: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
  };
}

// Service registry
const serviceRegistry: Record<string, ServiceConfig> = {
  'case-service': {
    name: 'Case Management Service',
    url: process.env.CASE_SERVICE_URL || 'http://case-service:3001',
    healthCheckUrl: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  },
  'document-service': {
    name: 'Document Service',
    url: process.env.DOCUMENT_SERVICE_URL || 'http://document-service:3002',
    healthCheckUrl: '/health',
    timeout: 60000,
    retries: 2,
    circuitBreaker: {
      timeout: 60000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  },
  'fleet-service': {
    name: 'Fleet Management Service',
    url: process.env.FLEET_SERVICE_URL || 'http://fleet-service:3003',
    healthCheckUrl: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  },
  'auth-service': {
    name: 'Authentication Service',
    url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3004',
    healthCheckUrl: '/health',
    timeout: 30000,
    retries: 2,
    circuitBreaker: {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  },
  'notification-service': {
    name: 'Notification Service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
    healthCheckUrl: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    }
  }
};

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Extended request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    workspaceId?: string;
  };
  requestId?: string;
  correlationId?: string;
}

// API Gateway class
export class APIGateway {
  private app: Express;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiter?: RateLimiterRedis;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupCircuitBreakers();
    this.setupRateLimiting();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  // Setup core middleware
  private setupMiddleware() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID and correlation ID
    this.app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      req.requestId = req.headers['x-request-id'] as string || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] as string || req.requestId;
      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      next();
    });

    // Request logging
    this.app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
          requestId: req.requestId,
          correlationId: req.correlationId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('user-agent'),
          ip: req.ip
        });
      });
      
      next();
    });

    // Prometheus metrics
    const metricsMiddleware = promBundle({
      includeMethod: true,
      includePath: true,
      includeStatusCode: true,
      includeUp: true,
      customLabels: { service: 'api-gateway' },
      promClient: {
        collectDefaultMetrics: {}
      }
    });
    this.app.use(metricsMiddleware);
  }

  // Setup circuit breakers
  private setupCircuitBreakers() {
    Object.entries(serviceRegistry).forEach(([serviceName, config]) => {
      const breaker = new CircuitBreaker(
        async (options: any) => {
          // Circuit breaker wrapped function
          return new Promise((resolve, reject) => {
            const proxy = createProxyMiddleware(options);
            proxy(options.req, options.res, (err) => {
              if (err) reject(err);
              else resolve(true);
            });
          });
        },
        config.circuitBreaker
      );

      // Circuit breaker event handlers
      breaker.on('open', () => {
        logger.error(`Circuit breaker opened for ${serviceName}`);
      });

      breaker.on('halfOpen', () => {
        logger.warn(`Circuit breaker half-open for ${serviceName}`);
      });

      breaker.on('close', () => {
        logger.info(`Circuit breaker closed for ${serviceName}`);
      });

      this.circuitBreakers.set(serviceName, breaker);
    });
  }

  // Setup rate limiting
  private async setupRateLimiting() {
    if (process.env.REDIS_HOST) {
      const Redis = await import('ioredis');
      const redisClient = new Redis.default({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      });

      this.rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rate-limit',
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 60, // Block for 1 minute
      });
    }
  }

  // Authentication middleware
  private authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        workspaceId: decoded.workspaceId
      };

      next();
    } catch (error) {
      logger.error('Authentication error', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Authorization middleware
  private authorize = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  };

  // Rate limiting middleware
  private rateLimit = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!this.rateLimiter) {
      return next();
    }

    try {
      const key = req.user?.id || req.ip;
      await this.rateLimiter.consume(key);
      next();
    } catch (rejRes: any) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60
      });
    }
  };

  // Service proxy middleware
  private createServiceProxy(serviceName: string) {
    const serviceConfig = serviceRegistry[serviceName];
    const circuitBreaker = this.circuitBreakers.get(serviceName);

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!serviceConfig) {
        return res.status(404).json({ error: 'Service not found' });
      }

      if (!circuitBreaker) {
        return res.status(503).json({ error: 'Service unavailable' });
      }

      const proxyOptions: Options = {
        target: serviceConfig.url,
        changeOrigin: true,
        timeout: serviceConfig.timeout,
        proxyTimeout: serviceConfig.timeout,
        onProxyReq: (proxyReq, req: any) => {
          // Forward authentication and tracking headers
          proxyReq.setHeader('x-user-id', req.user?.id || 'anonymous');
          proxyReq.setHeader('x-user-role', req.user?.role || 'guest');
          proxyReq.setHeader('x-workspace-id', req.user?.workspaceId || '');
          proxyReq.setHeader('x-request-id', req.requestId);
          proxyReq.setHeader('x-correlation-id', req.correlationId);
        },
        onProxyRes: (proxyRes, req, res) => {
          // Add service name to response headers
          proxyRes.headers['x-served-by'] = serviceName;
        },
        onError: (err, req, res) => {
          logger.error(`Proxy error for ${serviceName}`, err);
          (res as Response).status(502).json({
            error: 'Bad gateway',
            service: serviceName,
            requestId: (req as any).requestId
          });
        }
      };

      try {
        await circuitBreaker.fire({
          req,
          res,
          ...proxyOptions
        });
      } catch (error) {
        logger.error(`Circuit breaker error for ${serviceName}`, error);
        res.status(503).json({
          error: 'Service temporarily unavailable',
          service: serviceName,
          requestId: req.requestId
        });
      }
    };
  }

  // Setup routes
  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: Object.keys(serviceRegistry)
      });
    });

    // Service health checks
    this.app.get('/health/services', async (req, res) => {
      const healthChecks = await Promise.allSettled(
        Object.entries(serviceRegistry).map(async ([name, config]) => {
          try {
            const response = await fetch(`${config.url}${config.healthCheckUrl}`);
            return {
              name,
              status: response.ok ? 'healthy' : 'unhealthy',
              statusCode: response.status
            };
          } catch (error) {
            return {
              name,
              status: 'unhealthy',
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      res.json({
        services: healthChecks.map((result, index) => ({
          name: Object.keys(serviceRegistry)[index],
          ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason })
        }))
      });
    });

    // Public routes (no authentication required)
    this.app.post('/api/auth/login', this.createServiceProxy('auth-service'));
    this.app.post('/api/auth/register', this.createServiceProxy('auth-service'));
    this.app.post('/api/auth/refresh', this.createServiceProxy('auth-service'));

    // Protected routes
    this.app.use('/api/*', this.authenticate, this.rateLimit);

    // Case management routes
    this.app.use('/api/cases', this.createServiceProxy('case-service'));
    
    // Document management routes
    this.app.use('/api/documents', this.createServiceProxy('document-service'));
    
    // Fleet management routes
    this.app.use('/api/fleet', this.createServiceProxy('fleet-service'));
    
    // Notification routes
    this.app.use('/api/notifications', this.createServiceProxy('notification-service'));
    
    // Admin routes (require admin role)
    this.app.use('/api/admin/*', this.authorize(['admin']), (req, res, next) => {
      const service = req.path.split('/')[3]; // Extract service name
      const proxy = this.createServiceProxy(service);
      proxy(req, res, next);
    });

    // GraphQL federation endpoint (optional)
    this.app.use('/graphql', this.authenticate, (req, res) => {
      res.status(501).json({ error: 'GraphQL federation not implemented yet' });
    });

    // Catch-all route
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  // Error handling
  private setupErrorHandling() {
    this.app.use((err: any, req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      logger.error('Unhandled error', {
        error: err,
        requestId: req.requestId,
        path: req.path,
        method: req.method
      });

      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        requestId: req.requestId
      });
    });
  }

  // Start server
  public start(port: number = 3000) {
    this.app.listen(port, () => {
      logger.info(`API Gateway listening on port ${port}`);
      logger.info('Registered services:', Object.keys(serviceRegistry));
    });
  }

  // Get Express app (for testing)
  public getApp(): Express {
    return this.app;
  }
}

// Start the gateway if this file is run directly
if (require.main === module) {
  const gateway = new APIGateway();
  const port = parseInt(process.env.PORT || '3000');
  gateway.start(port);
}

export default APIGateway;