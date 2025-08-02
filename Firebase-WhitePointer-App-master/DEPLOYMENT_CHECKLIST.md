# Deployment Checklist

## Pre-deployment Steps

### 1. Environment Variables
Create `.env.production` with:
```
NODE_ENV=production
DATABASE_URL=./pbike-rescue.db
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Database Initialization
Ensure the database initializes on first run:
- [ ] Database creation works in production
- [ ] Initial data seeding works
- [ ] User accounts can be created

### 3. Build Test
```bash
npm run build
npm start
```
- [ ] Build completes without errors
- [ ] App starts correctly
- [ ] Database operations work
- [ ] Login functionality works

### 4. File Permissions
Ensure SQLite database file has proper permissions:
```bash
chmod 666 pbike-rescue.db
chmod 755 /path/to/app/directory
```

### 5. Production Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "start": "next start -p $PORT",
    "start:prod": "NODE_ENV=production next start"
  }
}
```

## Deployment Options

### Recommended: DigitalOcean Droplet
1. Create Ubuntu 22.04 droplet ($5/month)
2. Install Node.js 18+
3. Setup PM2 for process management
4. Configure Nginx as reverse proxy
5. Setup SSL with Let's Encrypt

### Quick Deploy: Railway
1. Connect GitHub repo
2. Set environment variables
3. Deploy with one click

### Alternative: Render
1. Connect GitHub repo
2. Set build/start commands
3. Configure persistent storage

## Post-deployment

### 1. Health Checks
- [ ] App loads correctly
- [ ] Database operations work
- [ ] Login/authentication works
- [ ] Case creation works
- [ ] Fleet management works
- [ ] File uploads work

### 2. Backup Strategy
Set up automated SQLite backups:
```bash
# Daily backup script
#!/bin/bash
cp pbike-rescue.db "backup-$(date +%Y%m%d).db"
```

### 3. Monitoring
- Set up uptime monitoring
- Monitor disk space (SQLite grows over time)
- Monitor memory usage

## Troubleshooting

### Common Issues
1. **Database locked**: Ensure proper file permissions
2. **Module not found**: Run `npm install` on server
3. **Port conflicts**: Use environment variable PORT
4. **File uploads fail**: Check storage permissions

### Database Issues
```bash
# Check database file
ls -la pbike-rescue.db

# Test database connection
sqlite3 pbike-rescue.db ".tables"

# Check database size
du -h pbike-rescue.db
```