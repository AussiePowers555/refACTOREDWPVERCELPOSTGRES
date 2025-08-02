# Vercel Deployment Guide

This Next.js application has been refactored to use PostgreSQL and is ready for deployment on Vercel.

## Database Migration

The application has been migrated from SQLite to PostgreSQL for Vercel compatibility:

- ✅ Replaced `better-sqlite3` with `@vercel/postgres`
- ✅ Updated all database schemas to PostgreSQL syntax  
- ✅ Converted synchronous database calls to async/await
- ✅ Updated API routes for async database operations

## Deployment Steps

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel
```

### 2. Set up Vercel Postgres

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Create a new "Postgres" database
4. Copy the environment variables provided

### 3. Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
POSTGRES_URL=your-postgres-connection-string
POSTGRES_PRISMA_URL=your-postgres-prisma-connection-string  
POSTGRES_URL_NON_POOLING=your-postgres-non-pooling-connection-string
POSTGRES_USER=your-postgres-user
POSTGRES_HOST=your-postgres-host
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DATABASE=your-postgres-database
```

### 4. Deploy

```bash
# Deploy to production
vercel --prod
```

## Key Changes Made

### Database Layer
- **Old**: `src/lib/database.ts` (SQLite with better-sqlite3)
- **New**: `src/lib/database-postgres.ts` (PostgreSQL with @vercel/postgres)

### Schema Updates
- Changed `DATETIME` to `TIMESTAMP`
- Changed `REAL` to `DECIMAL` 
- Removed SQLite-specific pragmas
- Updated all queries to use async/await

### API Routes
- Updated imports to use PostgreSQL database
- Added `await` to all database operations
- Maintained backward compatibility

## Database Schema

The PostgreSQL database includes these tables:
- `cases` - Main case management
- `contacts` - Client and service provider contacts
- `workspaces` - Organization workspaces
- `user_accounts` - User authentication
- `bikes` - Fleet management
- `signature_tokens` - Digital signature workflow
- `case_interactions` - Case activity logging
- `digital_signatures` - Signed documents
- `rental_agreements` - Rental contracts
- `signed_documents` - Document storage

## Production Considerations

### Performance
- Database connections are handled by Vercel Postgres
- Queries are optimized for PostgreSQL
- Consider adding database indexes for frequently queried fields

### Security
- Environment variables are securely managed by Vercel
- Database connections use SSL by default
- API routes include error handling

### Monitoring
- Use Vercel Analytics for performance monitoring
- Set up database monitoring through Vercel dashboard
- Consider adding logging service for production debugging

## Local Development

To run locally with PostgreSQL:

1. Set up local PostgreSQL database or use Vercel Postgres in development
2. Copy `.env.example` to `.env.local`
3. Fill in your database connection details
4. Run `npm run dev`

## Troubleshooting

### Database Connection Issues
- Verify all environment variables are set correctly
- Check Vercel Postgres dashboard for connection status
- Ensure your deployment region matches your database region

### Migration Issues
- Database tables are created automatically on first run
- Initial seed data is populated if tables are empty
- Check Vercel function logs for any initialization errors