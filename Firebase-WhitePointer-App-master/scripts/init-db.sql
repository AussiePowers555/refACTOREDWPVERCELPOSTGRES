-- PostgreSQL database initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (usually handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS whitepointer_db;

-- Switch to the application database
\c whitepointer_db;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: The actual table creation is handled by the application
-- through the initializeDatabase() function in src/lib/database.ts

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE whitepointer_db TO whitepointer_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO whitepointer_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO whitepointer_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO whitepointer_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO whitepointer_user;