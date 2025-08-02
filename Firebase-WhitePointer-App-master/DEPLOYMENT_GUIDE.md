# 🚀 Node.js + SQLite Deployment Guide

## Quick Deploy Options

### Option 1: VPS/Cloud Server (Recommended)
**Platforms:** DigitalOcean, AWS EC2, Google Cloud, Linode, Vultr

### Option 2: Docker Deployment
**Platforms:** Any Docker-compatible service

### Option 3: Platform-as-a-Service
**Platforms:** Railway, Render, Fly.io

---

## 🖥️ VPS Deployment (Ubuntu/CentOS)

### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Root or sudo access
- Domain name (optional)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

### Step 2: Deploy Application
```bash
# Clone or upload your code
git clone <your-repo-url>
cd Firebase-WhitePointer-App-master

# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

### Step 3: Setup Nginx (Optional)
```nginx
# /etc/nginx/sites-available/whitepointer
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whitepointer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🐳 Docker Deployment

### Build and Run
```bash
# Build image
docker build -t whitepointer-app .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d \
  --name whitepointer-app \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  whitepointer-app
```

### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## 🚄 Railway Deployment

### One-Click Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables in Railway
```
NODE_ENV=production
DATABASE_PATH=/app/data/pbike-rescue.db
```

---

## 🔧 Production Management

### PM2 Commands
```bash
# Start application
npm run pm2:start

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Monitor performance
pm2 monit
```

### Database Backup
```bash
# Manual backup
npm run backup-db

# Automated daily backup (crontab)
0 2 * * * cd /path/to/app && npm run backup-db
```

### Health Monitoring
```bash
# Check application health
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "casesCount": 10
}
```

---

## 🔒 Security Considerations

### Environment Variables
Create `.env.production`:
```
NODE_ENV=production
DATABASE_PATH=/secure/path/pbike-rescue.db
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://yourdomain.com
```

### File Permissions
```bash
# Database permissions
chmod 600 pbike-rescue.db
chown www-data:www-data pbike-rescue.db

# Application permissions
chown -R www-data:www-data /path/to/app
chmod -R 755 /path/to/app
```

### Firewall Setup
```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 📊 Monitoring & Maintenance

### Log Management
```bash
# PM2 logs
pm2 logs whitepointer-app --lines 100

# Application logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log
```

### Performance Monitoring
```bash
# Check memory usage
pm2 show whitepointer-app

# Check disk space
df -h

# Check database size
du -h pbike-rescue.db
```

### Updates
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Restart with zero downtime
pm2 reload whitepointer-app
```

---

## 🆘 Troubleshooting

### Common Issues

**Database locked error:**
```bash
# Check file permissions
ls -la pbike-rescue.db
chmod 666 pbike-rescue.db
```

**Port already in use:**
```bash
# Find process using port
lsof -i :3000
kill -9 <PID>
```

**Out of memory:**
```bash
# Increase PM2 memory limit
pm2 start ecosystem.config.js --max-memory-restart 2G
```

**Database corruption:**
```bash
# Check database integrity
sqlite3 pbike-rescue.db "PRAGMA integrity_check;"

# Restore from backup
cp backup-YYYYMMDD-HHMMSS.db pbike-rescue.db
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Use PM2 cluster mode: `instances: "max"`
- Implement Redis for session storage
- Consider PostgreSQL for larger datasets

### Vertical Scaling
- Monitor memory usage with PM2
- Optimize SQLite queries
- Implement database cleanup routines

### Backup Strategy
- Daily automated backups
- Off-site backup storage
- Database replication for critical data

---

## 🎯 Deployment Checklist

- [ ] Server setup complete
- [ ] Application deployed successfully
- [ ] Database initialized and accessible
- [ ] PM2 process manager running
- [ ] Nginx reverse proxy configured (if using)
- [ ] SSL certificate installed (if using domain)
- [ ] Environment variables set
- [ ] Health check endpoint working
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Firewall configured
- [ ] Domain DNS configured (if applicable)

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs whitepointer-app`
2. Verify health: `curl http://localhost:3000/api/health`
3. Check database: `sqlite3 pbike-rescue.db ".tables"`
4. Review permissions: `ls -la pbike-rescue.db`