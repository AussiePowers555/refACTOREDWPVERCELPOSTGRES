# Docker Development Setup

This guide explains how to run the WhitePointer motorbike rental management application using Docker with PostgreSQL.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

## Quick Start

### Development Mode (Recommended)

Run the application with hot reloading and debugging enabled:

```bash
# Start development environment
npm run docker:dev

# Or manually:
docker-compose -f docker-compose.dev.yml up
```

This will:
- Start PostgreSQL on port 5433
- Start the Next.js app on port 9003 
- Enable hot reloading for code changes
- Mount your local code directory

Access the application at: http://localhost:9003

### Production Mode

For production-like testing:

```bash
# Build and start production containers
npm run docker:build
npm run docker:up

# Or manually:
docker-compose build
docker-compose up -d
```

This will:
- Start PostgreSQL on port 5432
- Start the optimized Next.js app on port 3000

Access the application at: http://localhost:3000

## Available Commands

```bash
# Development
npm run docker:dev          # Start dev environment
npm run docker:dev:build    # Rebuild dev containers
npm run docker:dev:down     # Stop dev environment

# Production
npm run docker:build        # Build production containers
npm run docker:up          # Start production containers
npm run docker:down        # Stop containers
npm run docker:logs        # View app logs

# Maintenance
npm run docker:clean        # Remove containers and volumes
```

## Database Setup

The PostgreSQL database is automatically initialized when you first run the containers. The application will:

1. Create all necessary tables with proper constraints
2. Set up performance indexes
3. Insert initial seed data
4. Be ready for use

### Database Access

**Development:**
- Host: localhost
- Port: 5433
- Database: whitepointer_dev
- Username: dev_user
- Password: dev_password

**Production:**
- Host: localhost  
- Port: 5432
- Database: whitepointer_db
- Username: whitepointer_user
- Password: whitepointer_pass

### Database Management

```bash
# Connect to development database
psql -h localhost -p 5433 -U dev_user -d whitepointer_dev

# Connect to production database  
psql -h localhost -p 5432 -U whitepointer_user -d whitepointer_db

# Run database health check
docker-compose exec whitepointer-app npm run db:health

# Reinitialize database
docker-compose exec whitepointer-app npm run db:init
```

## File Structure

```
├── Dockerfile              # Production container config
├── docker-compose.yml      # Production setup
├── docker-compose.dev.yml  # Development setup
├── .dockerignore           # Files to exclude
└── scripts/
    └── init-db.sql         # PostgreSQL initialization
```

## Environment Variables

Key environment variables automatically configured in Docker:

```bash
# Database connection
POSTGRES_URL=postgresql://user:pass@postgres:5432/db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=database_name
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Application settings
NODE_ENV=development|production
NEXT_PUBLIC_BASE_URL=http://localhost:port
DATABASE_DEBUG=true
DATABASE_QUERY_LOGGING=true
```

## Data Persistence

- **Database data**: Persisted in Docker volumes
- **Logs**: Mounted to `./logs/` directory
- **Uploads**: Mounted to `./uploads/` directory

## Troubleshooting

### Container Issues

```bash
# View all containers
docker ps -a

# View container logs
docker-compose logs whitepointer-app
docker-compose logs postgres

# Restart containers
docker-compose restart

# Rebuild from scratch
npm run docker:clean
npm run docker:dev:build
npm run docker:dev
```

### Database Issues

```bash
# Check database connectivity
docker-compose exec postgres pg_isready -U dev_user -d whitepointer_dev

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v  # This removes all data!
docker-compose up
```

### Application Issues

```bash
# Check application health  
curl http://localhost:9003/api/health

# View application logs
npm run docker:logs

# Access container shell
docker-compose exec whitepointer-app sh
```

### Port Conflicts

If ports 3000, 5432, or 5433 are already in use:

1. Stop other services using those ports
2. Or modify the ports in `docker-compose.yml` and `docker-compose.dev.yml`

### Performance

For better performance on Windows/Mac:

1. Ensure Docker Desktop has adequate resources (4GB+ RAM)
2. Consider moving the project to the Docker Desktop Linux VM
3. Use `npm run docker:dev` for development with hot reloading

## Security Notes

- Default passwords are for development only
- Change passwords in production environments
- Database ports are exposed for development convenience
- Use proper secrets management in production