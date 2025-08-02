/**
 * PostgreSQL Database Service - Enterprise Database Implementation
 * Implements connection pooling, read replicas, caching, and monitoring
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { createHash } from 'crypto';

// Import schema types
import type {
  Case,
  Contact,
  Workspace,
  UserAccount,
  CaseFrontend,
  ContactFrontend,
  WorkspaceFrontend,
  BikeFrontend,
  SignatureToken,
  DigitalSignature,
  Bike
} from './database-schema';
import { SchemaTransformers } from './database-schema';

// Redis interface for caching (optional dependency)
interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  quit(): Promise<void>;
  on(event: string, listener: (err: Error) => void): void;
}

// Configuration interfaces
interface DatabaseConfig {
  master: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  };
  replicas?: Array<{
    host: string;
    port: number;
  }>;
  poolConfig?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  cache?: {
    enabled: boolean;
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
    ttl?: number;
  };
  monitoring?: {
    enabled: boolean;
    slowQueryThreshold?: number;
  };
}

// Query metrics for monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Database connection manager with read replica support
class DatabaseConnectionManager {
  private masterPool!: Pool;
  private replicaPools: Pool[] = [];
  private currentReplicaIndex = 0;
  private redisClient?: RedisClient;
  private config: DatabaseConfig;
  private queryMetrics: QueryMetrics[] = [];

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializePools();
    this.initializeCache();
  }

  private initializePools() {
    // Master pool configuration
    const poolConfig = {
      ...this.config.master,
      min: this.config.poolConfig?.min || 2,
      max: this.config.poolConfig?.max || 10,
      idleTimeoutMillis: this.config.poolConfig?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: this.config.poolConfig?.connectionTimeoutMillis || 2000,
      statement_timeout: 30000,
      query_timeout: 30000,
      // Connection lifecycle hooks
      connect: async (client: PoolClient) => {
        await client.query('SET search_path TO public');
        await client.query('SET statement_timeout TO 30000');
      }
    };

    // Create master pool
    this.masterPool = new Pool(poolConfig);

    // Create replica pools
    if (this.config.replicas && this.config.replicas.length > 0) {
      this.replicaPools = this.config.replicas.map(replica => 
        new Pool({
          ...poolConfig,
          host: replica.host,
          port: replica.port
        })
      );
    }

    // Error handlers
    this.masterPool.on('error', (err) => {
      console.error('Master pool error:', err);
    });

    this.replicaPools.forEach((pool, index) => {
      pool.on('error', (err) => {
        console.error(`Replica pool ${index} error:`, err);
      });
    });
  }

  private async initializeCache() {
    if (this.config.cache?.enabled && this.config.cache.redis) {
      try {
        // Dynamically import Redis if available
        const { default: Redis } = await import('ioredis');
        const redisInstance = new Redis({
          host: this.config.cache.redis.host,
          port: this.config.cache.redis.port,
          password: this.config.cache.redis.password,
          retryStrategy: (times: number) => Math.min(times * 50, 2000)
        });

        this.redisClient = redisInstance as unknown as RedisClient;
        this.redisClient.on('error', (err: Error) => {
          console.error('Redis error:', err);
        });
      } catch (error) {
        console.warn('Redis not available, caching disabled');
      }
    }
  }

  // Get appropriate pool based on query type
  private getPool(isWrite: boolean = false): Pool {
    if (isWrite || this.replicaPools.length === 0) {
      return this.masterPool;
    }

    // Round-robin replica selection
    const pool = this.replicaPools[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicaPools.length;
    return pool;
  }

  // Execute query with monitoring and error handling
  async query<T extends QueryResultRow = any>(
    text: string,
    values?: any[],
    options?: { useReplica?: boolean; cacheTTL?: number }
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(text);
    const pool = this.getPool(isWrite || !options?.useReplica);

    // Check cache for read queries
    if (!isWrite && this.redisClient && options?.cacheTTL) {
      const cacheKey = this.generateCacheKey(text, values);
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    let client: PoolClient | undefined;
    try {
      client = await pool.connect();
      const result = await client.query<T>(text, values);

      // Cache result if applicable
      if (!isWrite && this.redisClient && options?.cacheTTL) {
        const cacheKey = this.generateCacheKey(text, values);
        await this.redisClient.setex(
          cacheKey,
          options.cacheTTL,
          JSON.stringify(result)
        );
      }

      // Record metrics
      this.recordMetrics({
        query: text,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        success: true
      });

      return result;
    } catch (error) {
      // Record error metrics
      this.recordMetrics({
        query: text,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Transaction support
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.masterPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate cache key
  private generateCacheKey(query: string, values?: any[]): string {
    const hash = createHash('sha256');
    hash.update(query);
    if (values) {
      hash.update(JSON.stringify(values));
    }
    return `query:${hash.digest('hex')}`;
  }

  // Record query metrics
  private recordMetrics(metrics: QueryMetrics) {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 queries
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    if (
      this.config.monitoring?.enabled &&
      metrics.duration > (this.config.monitoring.slowQueryThreshold || 1000)
    ) {
      console.warn('Slow query detected:', {
        query: metrics.query,
        duration: metrics.duration,
        timestamp: metrics.timestamp
      });
    }
  }

  // Get query metrics
  getMetrics(): QueryMetrics[] {
    return [...this.queryMetrics];
  }

  // Cleanup connections
  async close() {
    await Promise.all([
      this.masterPool.end(),
      ...this.replicaPools.map(pool => pool.end()),
      this.redisClient?.quit()
    ]);
  }
}

// Initialize database connection
let dbManager: DatabaseConnectionManager;

export function initializeDatabase(config?: DatabaseConfig) {
  if (!config) {
    // Default configuration from environment variables
    config = {
      master: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'whitepointer',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true'
      },
      replicas: process.env.DB_REPLICA_HOSTS?.split(',').map((host, index) => ({
        host,
        port: parseInt(process.env.DB_REPLICA_PORTS?.split(',')[index] || '5432')
      })),
      poolConfig: {
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '10')
      },
      cache: {
        enabled: process.env.REDIS_ENABLED === 'true',
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD
        },
        ttl: parseInt(process.env.CACHE_TTL || '300')
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000')
      }
    };
  }

  dbManager = new DatabaseConnectionManager(config);
  console.log('✅ PostgreSQL database initialized with connection pooling');
  
  return dbManager;
}

// Ensure database is initialized
export function ensureDatabaseInitialized() {
  if (!dbManager) {
    initializeDatabase();
  }
  return dbManager;
}

// Database service implementation
export const DatabaseService = {
  // Case operations
  async createCase(caseData: Partial<Case>): Promise<Case> {
    ensureDatabaseInitialized();
    
    const id = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO cases (
        id, case_number, workspace_id, status, last_updated,
        naf_name, naf_phone, naf_email, naf_address, naf_suburb,
        naf_state, naf_postcode, naf_claim_number, naf_insurance_company,
        naf_insurer, naf_vehicle_rego,
        af_name, af_phone, af_email, af_address, af_suburb,
        af_state, af_postcode, af_claim_number, af_insurance_company,
        af_insurer, af_vehicle_rego,
        assigned_lawyer_id, assigned_rental_company_id,
        invoiced, reserve, agreed, paid,
        accident_date, accident_time, accident_description, accident_diagram,
        created_date, modified_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39
      ) RETURNING *
    `;
    
    const values = [
      id,
      caseData.case_number,
      caseData.workspace_id,
      caseData.status || 'Active',
      now,
      caseData.naf_name,
      caseData.naf_phone,
      caseData.naf_email,
      caseData.naf_address,
      caseData.naf_suburb,
      caseData.naf_state,
      caseData.naf_postcode,
      caseData.naf_claim_number,
      caseData.naf_insurance_company,
      caseData.naf_insurer,
      caseData.naf_vehicle_rego,
      caseData.af_name,
      caseData.af_phone,
      caseData.af_email,
      caseData.af_address,
      caseData.af_suburb,
      caseData.af_state,
      caseData.af_postcode,
      caseData.af_claim_number,
      caseData.af_insurance_company,
      caseData.af_insurer,
      caseData.af_vehicle_rego,
      caseData.assigned_lawyer_id,
      caseData.assigned_rental_company_id,
      caseData.invoiced || 0,
      caseData.reserve || 0,
      caseData.agreed || 0,
      caseData.paid || 0,
      caseData.accident_date,
      caseData.accident_time,
      caseData.accident_description,
      caseData.accident_diagram,
      now,
      now
    ];
    
    const result = await dbManager.query<Case>(query, values);
    return result.rows[0];
  },

  async getAllCases(): Promise<CaseFrontend[]> {
    ensureDatabaseInitialized();
    
    const query = `
      SELECT c.*, 
             l.name as lawyer_name, 
             r.name as rental_company_name
      FROM cases c
      LEFT JOIN contacts l ON c.assigned_lawyer_id = l.id
      LEFT JOIN contacts r ON c.assigned_rental_company_id = r.id
      ORDER BY c.modified_date DESC
    `;
    
    const result = await dbManager.query<Case>(query, undefined, { 
      useReplica: true,
      cacheTTL: 60 // Cache for 1 minute
    });
    
    return result.rows.map(row => SchemaTransformers.caseDbToFrontend(row));
  },

  async getCaseById(id: string): Promise<CaseFrontend | null> {
    ensureDatabaseInitialized();
    
    const query = `
      SELECT c.*, 
             l.name as lawyer_name, 
             r.name as rental_company_name
      FROM cases c
      LEFT JOIN contacts l ON c.assigned_lawyer_id = l.id
      LEFT JOIN contacts r ON c.assigned_rental_company_id = r.id
      WHERE c.id = $1
    `;
    
    const result = await dbManager.query<Case>(query, [id], { 
      useReplica: true,
      cacheTTL: 300 // Cache for 5 minutes
    });
    
    return result.rows[0] ? SchemaTransformers.caseDbToFrontend(result.rows[0]) : null;
  },

  async updateCase(id: string, updates: Partial<Case>): Promise<void> {
    ensureDatabaseInitialized();
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE cases
      SET ${setClause}, modified_date = $${values.length + 1}
      WHERE id = $${values.length + 2}
    `;
    
    await dbManager.query(query, [...values, new Date().toISOString(), id]);
  },

  async deleteCase(id: string): Promise<boolean> {
    ensureDatabaseInitialized();
    
    const result = await dbManager.query(
      'DELETE FROM cases WHERE id = $1',
      [id]
    );
    
    return (result.rowCount ?? 0) > 0;
  },

  // Contact operations
  async getAllContacts(): Promise<ContactFrontend[]> {
    ensureDatabaseInitialized();
    
    const result = await dbManager.query<Contact>(
      'SELECT * FROM contacts ORDER BY name',
      undefined,
      { useReplica: true, cacheTTL: 300 }
    );
    
    return result.rows.map(SchemaTransformers.contactDbToFrontend);
  },

  async createContact(contactData: Partial<Contact>): Promise<Contact> {
    ensureDatabaseInitialized();
    
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO contacts (id, name, company, type, phone, email, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      id,
      contactData.name,
      contactData.company,
      contactData.type,
      contactData.phone,
      contactData.email,
      contactData.address
    ];
    
    const result = await dbManager.query<Contact>(query, values);
    return result.rows[0];
  },

  // Workspace operations
  async getAllWorkspaces(): Promise<WorkspaceFrontend[]> {
    ensureDatabaseInitialized();
    
    const result = await dbManager.query<Workspace>(
      'SELECT * FROM workspaces ORDER BY name',
      undefined,
      { useReplica: true, cacheTTL: 300 }
    );
    
    return result.rows.map(SchemaTransformers.workspaceDbToFrontend);
  },

  // Transaction example for complex operations
  async transferCase(caseId: string, newWorkspaceId: string): Promise<void> {
    ensureDatabaseInitialized();
    
    await dbManager.transaction(async (client) => {
      // Update case workspace
      await client.query(
        'UPDATE cases SET workspace_id = $1, modified_date = $2 WHERE id = $3',
        [newWorkspaceId, new Date().toISOString(), caseId]
      );
      
      // Log the transfer
      await client.query(
        'INSERT INTO audit_log (entity_type, entity_id, action, details) VALUES ($1, $2, $3, $4)',
        ['case', caseId, 'transfer', { newWorkspaceId }]
      );
    });
  },

  // Bike operations with optimized queries
  async getBikes(): Promise<BikeFrontend[]> {
    ensureDatabaseInitialized();
    
    const query = `
      SELECT b.*,
             c.case_number as assigned_case_number
      FROM bikes b
      LEFT JOIN cases c ON b.assigned_case_id = c.id
      ORDER BY b.make, b.model
    `;
    
    const result = await dbManager.query<Bike>(query, undefined, {
      useReplica: true,
      cacheTTL: 120
    });
    
    return result.rows.map(SchemaTransformers.bikeDbToFrontend);
  },

  // Health check methods
  isInitialized(): boolean {
    return !!dbManager;
  },

  async getTableList(): Promise<string[]> {
    ensureDatabaseInitialized();
    
    const result = await dbManager.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'`
    );
    
    return result.rows.map(row => row.table_name);
  },

  async getTableColumns(tableName: string): Promise<any[]> {
    ensureDatabaseInitialized();
    
    const result = await dbManager.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' 
       AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    
    return result.rows;
  },

  async rawQuery(query: string): Promise<any> {
    ensureDatabaseInitialized();
    const result = await dbManager.query(query);
    return result.rows[0];
  },

  // Get database metrics
  getMetrics() {
    return dbManager?.getMetrics() || [];
  },

  // Close database connections
  async close() {
    if (dbManager) {
      await dbManager.close();
    }
  }
};

// Export manager instance for advanced usage
export { dbManager };