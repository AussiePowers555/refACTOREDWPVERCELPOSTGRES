import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/database-schema-pg.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://localhost:5432/whitepointer_dev',
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations',
    schema: 'public',
  },
} satisfies Config;