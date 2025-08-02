# Local Development Setup Guide

## 🐳 Docker Setup (Recommended)

The easiest way to run the application locally with PostgreSQL:

### Quick Start
```bash
# Start development environment
npm run docker:dev

# Access the application
open http://localhost:9003
```

### What This Does:
- ✅ Starts PostgreSQL database on port 5433
- ✅ Starts Next.js app on port 9003 with hot reloading
- ✅ Automatically installs dependencies
- ✅ Mounts your code for live changes
- ✅ Sets up all environment variables

### Docker Commands:
```bash
npm run docker:dev        # Start development environment
npm run docker:dev:down   # Stop development environment
npm run docker:logs       # View application logs
npm run docker:clean      # Clean up everything
```

---

## 💻 Manual Setup (Alternative)

If you prefer to run without Docker:

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### 1. Database Setup
```bash
# Install PostgreSQL locally or use a cloud provider
# Create database
createdb whitepointer_local

# Or connect to existing PostgreSQL instance
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your database connection:
POSTGRES_URL="postgresql://username:password@localhost:5432/whitepointer_local"
```

### 3. Install Dependencies & Start
```bash
# Install dependencies 
npm install

# Initialize database
npm run db:init

# Start development server
npm run dev
```

Access at: http://localhost:9003

---

## 🔧 Troubleshooting

### Docker Issues

**"localhost refused to connect"**
```bash
# Check containers are running
docker ps

# Check logs
npm run docker:logs

# Restart containers
npm run docker:dev:down
npm run docker:dev
```

**Port conflicts**
```bash
# Check what's using the ports
netstat -tulpn | grep :9003
netstat -tulpn | grep :5433

# Stop conflicting services or change ports in docker-compose.dev.yml
```

**Build issues**
```bash
# Clean everything and rebuild
npm run docker:clean
npm run docker:dev:build
npm run docker:dev
```

### Database Issues

**Connection errors**
```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.dev.yml logs postgres

# Test database connection
docker-compose -f docker-compose.dev.yml exec postgres psql -U dev_user -d whitepointer_dev -c "SELECT version();"
```

**Schema issues**
```bash
# Reinitialize database
docker-compose -f docker-compose.dev.yml exec whitepointer-app npm run db:init

# Check database health
docker-compose -f docker-compose.dev.yml exec whitepointer-app npm run db:health
```

### Application Issues

**Module not found errors**
```bash
# Clear node_modules and reinstall
npm run docker:dev:down
docker volume rm firebase-whitepointer-app-master_node_modules_cache
npm run docker:dev
```

**TypeScript errors**
```bash
# Run type check
npm run typecheck

# If in container:
docker-compose -f docker-compose.dev.yml exec whitepointer-app npm run typecheck
```

---

## 📊 Database Management

### Access Database
```bash
# Connect to development database
docker-compose -f docker-compose.dev.yml exec postgres psql -U dev_user -d whitepointer_dev

# Run queries
SELECT * FROM cases LIMIT 5;
SELECT COUNT(*) FROM contacts;
```

### Database Operations
```bash
# Health check
npm run db:health

# Reinitialize schema
npm run db:init

# Migration script
npm run db:migrate
```

### Backup & Restore
```bash
# Backup database
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U dev_user whitepointer_dev > backup.sql

# Restore database
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U dev_user whitepointer_dev < backup.sql
```

---

## 🚀 Production Deployment

For production deployment, see:
- `README-Docker.md` - Docker production setup
- Vercel deployment with Vercel Postgres
- Railway/Render deployment options

---

## 📝 Development Tips

1. **Hot Reloading**: Code changes automatically reload in Docker
2. **Database Persistence**: Database data persists between container restarts
3. **Log Monitoring**: Use `npm run docker:logs` to monitor application logs
4. **Port Access**: App on 9003, Database on 5433
5. **Clean Slate**: Use `npm run docker:clean` to start fresh