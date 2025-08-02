/**
 * PostgreSQL Database Connection Manager
 * Enterprise-grade connection pooling, retry logic, and monitoring
 * 
 * Features:
 * - Connection pooling with read replicas
 * - Automatic retry and circuit breaker
 * - Query performance monitoring
 * - Health checks and metrics
 * - Environment-based configuration
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as schema from './database-schema-pg';

// Connection configuration interface
interface DatabaseConfig {
  primary: {
    connectionString: string;
    ssl?: boolean;
  };
  replicas?: string[];
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
    acquireTimeoutMillis: number;
  };
  retry: {
    attempts: number;
    delay: number;
    backoffMultiplier: number;
  };
  monitoring: {
    slowQueryThreshold: number;
    enabled: boolean;
  };
}

// Environment-based configuration
function getConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Determine connection string priority
  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.POSTGRES_PRISMA_URL ||
    (isDevelopment ? 'postgresql://postgres:password@localhost:5432/whitepointer_dev' : '');

  if (!connectionString) {
    throw new Error('DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL environment variable is required');
  }

  return {
    primary: {
      connectionString,
      ssl: isProduction || process.env.DATABASE_SSL === 'true',
    },
    replicas: process.env.DATABASE_REPLICA_URLS ? 
      process.env.DATABASE_REPLICA_URLS.split(',') : [],
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || (isProduction ? '5' : '2')),
      max: parseInt(process.env.DB_POOL_MAX || (isProduction ? '25' : '10')),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'), // 5 minutes
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // 30 seconds
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 1 minute
    },
    retry: {
      attempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      delay: parseInt(process.env.DB_RETRY_DELAY || '1000'), // 1 second
      backoffMultiplier: parseInt(process.env.DB_RETRY_BACKOFF || '2'),
    },
    monitoring: {
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000'),
      enabled: process.env.DB_MONITORING_ENABLED !== 'false',
    },
  };
}

// Query metrics for monitoring
interface QueryMetric {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  pool: 'primary' | 'replica';
}

// Connection health status
interface HealthStatus {
  isHealthy: boolean;
  primaryPool: {
    total: number;
    idle: number;
    waiting: number;
  };
  replicaPools?: Array<{
    total: number;
    idle: number;
    waiting: number;
  }>;
  lastError?: string;
  uptime: number;
}

class DatabaseConnectionManager {
  private primaryPool: Pool;
  private replicaPools: Pool[] = [];
  private currentReplicaIndex = 0;
  private config: DatabaseConfig;
  private queryMetrics: QueryMetric[] = [];
  private startTime = Date.now();
  private lastError?: string;
  private circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
    timeout: 60000, // 1 minute
  };

  // Drizzle instances
  public primaryDb: ReturnType<typeof drizzle>;
  public replicaDb?: ReturnType<typeof drizzle>;

  constructor() {
    this.config = getConfig();
    this.initializePools();
    this.setupHealthChecks();
  }

  private initializePools() {
    console.log('🔄 Initializing PostgreSQL connection pools...');
    
    // Primary pool configuration
    const primaryPoolConfig: PoolConfig = {
      connectionString: this.config.primary.connectionString,
      min: this.config.pool.min,
      max: this.config.pool.max,
      idleTimeoutMillis: this.config.pool.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.pool.connectionTimeoutMillis,
      acquireTimeoutMillis: this.config.pool.acquireTimeoutMillis,
      ssl: this.config.primary.ssl ? { rejectUnauthorized: false } : false,
      
      // Connection lifecycle hooks
      application_name: 'WhitePointer-App',
      statement_timeout: 30000, // 30 seconds
      query_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
    };

    // Create primary pool
    this.primaryPool = new Pool(primaryPoolConfig);
    this.primaryDb = drizzle(this.primaryPool, { schema });

    // Setup primary pool error handling
    this.primaryPool.on('error', (err) => {
      console.error('❌ Primary pool error:', err);
      this.lastError = err.message;
      this.incrementCircuitBreaker();
    });

    this.primaryPool.on('connect', (client) => {
      console.log('✅ New primary pool connection established');
    });

    // Create replica pools if configured
    if (this.config.replicas && this.config.replicas.length > 0) {
      this.replicaPools = this.config.replicas.map((replicaUrl, index) => {
        const replicaPool = new Pool({
          ...primaryPoolConfig,
          connectionString: replicaUrl,
        });

        replicaPool.on('error', (err) => {
          console.error(`❌ Replica pool ${index} error:`, err);
        });

        replicaPool.on('connect', () => {
          console.log(`✅ New replica pool ${index} connection established`);
        });

        return replicaPool;
      });

      // Use first replica as default for read operations
      if (this.replicaPools.length > 0) {
        this.replicaDb = drizzle(this.replicaPools[0], { schema });
      }
    }

    console.log(`✅ PostgreSQL pools initialized: 1 primary + ${this.replicaPools.length} replicas`);
  }

  private setupHealthChecks() {
    // Periodic health check every 30 seconds
    setInterval(async () => {
      try {
        await this.healthCheck();
        this.resetCircuitBreaker();
      } catch (error) {
        console.error('❌ Health check failed:', error);
        this.lastError = error instanceof Error ? error.message : 'Unknown health check error';
        this.incrementCircuitBreaker();
      }
    }, 30000);
  }

  private incrementCircuitBreaker() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= 5) {
      this.circuitBreaker.isOpen = true;
      console.warn('⚠️ Circuit breaker opened due to consecutive failures');
    }
  }

  private resetCircuitBreaker() {
    if (this.circuitBreaker.isOpen && 
        Date.now() - this.circuitBreaker.lastFailure > this.circuitBreaker.timeout) {
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failures = 0;
      console.log('✅ Circuit breaker reset');
    }
  }

  // Get appropriate database instance for read/write operations
  getDb(forWrite: boolean = false): ReturnType<typeof drizzle> {
    if (this.circuitBreaker.isOpen) {
      throw new Error('Database circuit breaker is open');
    }

    if (forWrite || !this.replicaDb) {
      return this.primaryDb;
    }

    // Round-robin replica selection for read operations
    if (this.replicaPools.length > 1) {
      const selectedPool = this.replicaPools[this.currentReplicaIndex];
      this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicaPools.length;
      return drizzle(selectedPool, { schema });
    }

    return this.replicaDb;
  }

  // Execute query with retry logic and monitoring
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    isWrite: boolean = false
  ): Promise<T> {
    if (this.circuitBreaker.isOpen) {
      throw new Error('Database circuit breaker is open - please try again later');
    }

    let lastError: Error;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.config.retry.attempts; attempt++) {
      try {
        const result = await operation();
        
        // Record successful query metric
        if (this.config.monitoring.enabled) {
          this.recordQueryMetric({
            query: operationName,
            duration: Date.now() - startTime,
            timestamp: new Date(),
            success: true,
            pool: isWrite ? 'primary' : 'replica',
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown database error');
        console.warn(`⚠️ Database operation '${operationName}' failed (attempt ${attempt}/${this.config.retry.attempts}):`, lastError.message);

        // Record failed query metric
        if (this.config.monitoring.enabled) {
          this.recordQueryMetric({
            query: operationName,
            duration: Date.now() - startTime,
            timestamp: new Date(),
            success: false,
            error: lastError.message,
            pool: isWrite ? 'primary' : 'replica',
          });
        }

        // Don't retry on final attempt
        if (attempt === this.config.retry.attempts) {
          this.incrementCircuitBreaker();
          break;
        }

        // Exponential backoff delay
        const delay = this.config.retry.delay * Math.pow(this.config.retry.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private recordQueryMetric(metric: QueryMetric) {
    this.queryMetrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    if (metric.duration > this.config.monitoring.slowQueryThreshold) {
      console.warn(`🐌 Slow query detected (${metric.duration}ms): ${metric.query}`);
    }
  }

  // Run database migrations
  async runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');
    
    try {
      await this.executeWithRetry(async () => {
        await migrate(this.primaryDb, { migrationsFolder: './migrations' });
      }, 'run_migrations', true);
      
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Health check method
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test primary pool
      await this.primaryDb.execute(sql`SELECT 1 as health_check`);
      
      // Test replica pools
      for (const replicaDb of this.replicaPools) {
        const db = drizzle(replicaDb, { schema });
        await db.execute(sql`SELECT 1 as health_check`);
      }

      const status: HealthStatus = {
        isHealthy: true,
        primaryPool: {
          total: this.primaryPool.totalCount,
          idle: this.primaryPool.idleCount,
          waiting: this.primaryPool.waitingCount,
        },
        replicaPools: this.replicaPools.map(pool => ({
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        })),
        uptime: Date.now() - this.startTime,
      };

      return status;
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get query metrics
  getQueryMetrics(): QueryMetric[] {
    return [...this.queryMetrics];
  }

  // Get performance statistics
  getPerformanceStats() {
    const metrics = this.queryMetrics;
    const now = Date.now();
    const lastHour = metrics.filter(m => now - m.timestamp.getTime() < 3600000);
    
    return {
      totalQueries: metrics.length,
      queriesLastHour: lastHour.length,
      averageResponseTime: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0,
      slowQueries: metrics.filter(m => m.duration > this.config.monitoring.slowQueryThreshold).length,
      errorRate: (metrics.filter(m => !m.success).length / metrics.length) * 100 || 0,
      circuitBreakerStatus: {
        isOpen: this.circuitBreaker.isOpen,
        failures: this.circuitBreaker.failures,
        lastFailure: this.circuitBreaker.lastFailure,
      },
    };
  }

  // Graceful shutdown
  async close(): Promise<void> {
    console.log('🔄 Closing database connections...');
    
    try {
      await Promise.all([
        this.primaryPool.end(),
        ...this.replicaPools.map(pool => pool.end()),
      ]);
      
      console.log('✅ All database connections closed');
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
      throw error;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      primary: {
        total: this.primaryPool.totalCount,
        idle: this.primaryPool.idleCount,
        waiting: this.primaryPool.waitingCount,
      },
      replicas: this.replicaPools.map((pool, index) => ({
        index,
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      })),
      circuitBreaker: {
        isOpen: this.circuitBreaker.isOpen,
        failures: this.circuitBreaker.failures,
      },
      uptime: Date.now() - this.startTime,
      lastError: this.lastError,
    };
  }
}

// Singleton instance
let dbManager: DatabaseConnectionManager | null = null;

// Initialize database connection manager
export function initializeDatabase(): DatabaseConnectionManager {
  if (!dbManager) {
    dbManager = new DatabaseConnectionManager();
    console.log('✅ PostgreSQL Database Connection Manager initialized');
  }
  return dbManager;
}

// Get database connection manager instance
export function getDatabase(): DatabaseConnectionManager {
  if (!dbManager) {
    dbManager = initializeDatabase();
  }
  return dbManager;
}

// Export types
export type { DatabaseConfig, QueryMetric, HealthStatus };

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('📡 Received SIGINT, closing database connections...');
    if (dbManager) {
      await dbManager.close();
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('📡 Received SIGTERM, closing database connections...');
    if (dbManager) {
      await dbManager.close();
    }
    process.exit(0);
  });
}

console.log('✅ PostgreSQL Connection Manager loaded');