# TajMap Deployment Guide

## Recommended Setup: Laravel Forge + DigitalOcean

This guide will help you deploy your TajMap application to production with zero DevOps experience required.

---

## 📋 Prerequisites Checklist

Before deployment, ensure you have:

- [ ] GitHub/GitLab/Bitbucket account with your code pushed
- [ ] Domain name purchased (e.g., tajmap.com)
- [ ] Credit card for hosting payments
- [ ] Email address for SSL certificates

---

## 💰 Cost Breakdown

| Service | Cost | Purpose |
|---------|------|---------|
| Laravel Forge | $12/month | Server management |
| DigitalOcean Droplet | $24/month | Server (4GB RAM) |
| Domain Name | $10-15/year | yoursite.com |
| **Total** | **~$36/month** | Full production setup |

### Can I Start Cheaper?
Yes! Start with $12/month DigitalOcean droplet (2GB RAM) = $24/month total.
Upgrade when you get more users.

---

## 🚀 Deployment Steps

### Step 1: Sign Up for Laravel Forge

1. Go to [forge.laravel.com](https://forge.laravel.com)
2. Create account ($12/month)
3. Connect your payment method

### Step 2: Sign Up for DigitalOcean

1. Go to [digitalocean.com](https://digitalocean.com)
2. Create account (Use [this referral link](https://m.do.co/c/your-link) for $200 free credits)
3. Add credit card

### Step 3: Connect Forge to DigitalOcean

1. In Forge, go to **Account → Server Providers**
2. Click **DigitalOcean** and follow instructions
3. Generate API token from DigitalOcean
4. Paste token in Forge

### Step 4: Create Your Server

1. In Forge, click **Create Server**
2. Select these options:
   ```
   Provider: DigitalOcean
   Server Type: App Server
   Name: tajmap-production
   Region: [Choose closest to users]
   Server Size: 4GB RAM / 2 CPU ($24/mo)
   PHP Version: 8.2
   Database: MySQL 8.0
   ```
3. Click **Create Server** (takes ~5 minutes)

### Step 5: Create Your Site

1. Once server is ready, click **New Site**
2. Enter your domain: `tajmap.com` or `www.tajmap.com`
3. Select **Project Type**: Laravel
4. Click **Add Site**

### Step 6: Install SSL Certificate (Free)

1. Go to your site in Forge
2. Click **SSL** tab
3. Click **LetsEncrypt**
4. Enter your email
5. Click **Obtain Certificate** (takes 1 minute)
6. Enable **Force HTTPS**

### Step 7: Connect to Git

1. In Forge, go to your site
2. Click **Apps** tab
3. Click **GitHub** (or GitLab/Bitbucket)
4. Authorize Forge to access your repository
5. Select your repository: `yourusername/TajMap`
6. Select branch: `main` or `master`
7. Click **Install Repository**

### Step 8: Configure Environment

1. In Forge, click **Environment** tab
2. Update these values:

```env
APP_NAME=TajMap
APP_ENV=production
APP_KEY= # Forge generates this automatically
APP_DEBUG=false
APP_URL=https://tajmap.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=forge
DB_USERNAME=forge
DB_PASSWORD= # Forge shows this in Database tab

# Email Configuration (Use Mailtrap, SendGrid, or Mailgun)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@tajmap.com
MAIL_FROM_NAME="${APP_NAME}"

# Session & Cache
SESSION_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis (Already installed by Forge)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

3. Click **Save**

### Step 9: Configure Deployment Script

1. In Forge, click **Deployment** tab
2. Update deployment script:

```bash
cd /home/forge/tajmap.com

# Enable maintenance mode
php artisan down

# Pull latest code
git pull origin main

# Install Composer dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
php artisan migrate --force

# Build frontend assets
npm ci
npm run build

# Clear application cache
php artisan cache:clear

# Optimize application
php artisan optimize

# Restart queue workers
php artisan queue:restart

# Disable maintenance mode
php artisan up
```

3. Click **Save**

### Step 10: Initial Deployment

1. Click **Deploy Now** button
2. Wait for deployment to complete (~2-3 minutes)
3. Check deployment log for any errors

### Step 11: Set Up Database

In Forge terminal (or SSH), run:

```bash
cd /home/forge/tajmap.com
php artisan migrate --seed
```

### Step 12: Configure Queue Worker

1. In Forge, go to **Queue** tab
2. Click **Create Queue Worker**
3. Settings:
   ```
   Connection: redis
   Queue: default
   Max Processes: 1
   Max Tries: 3
   ```
4. Click **Create**

### Step 13: Configure Scheduled Jobs

1. In Forge, go to **Scheduler** tab
2. Forge automatically runs Laravel's scheduler
3. No additional configuration needed!

### Step 14: Set Up File Storage

1. Create storage directory:
```bash
cd /home/forge/tajmap.com
php artisan storage:link
```

2. Set proper permissions:
```bash
chmod -R 775 storage bootstrap/cache
chown -R forge:forge storage bootstrap/cache
```

### Step 15: Configure Backups (IMPORTANT!)

1. In Forge, go to **Backups** tab
2. Configure database backups:
   ```
   Provider: Choose (AWS S3, DigitalOcean Spaces, etc.)
   Frequency: Daily at 2:00 AM
   Retention: 7 days
   ```
3. Enable **Database Backups**

---

## 🔒 Security Configuration

### 1. Update Firewall Rules
Forge automatically configures firewall. Default rules:
- Port 22 (SSH) - Restricted to Forge IPs
- Port 80 (HTTP) - Open
- Port 443 (HTTPS) - Open

### 2. Set Up 2FA
1. Go to Forge **Account Settings**
2. Enable Two-Factor Authentication

### 3. Restrict SSH Access
1. In Forge, go to server **Network** tab
2. Add your IP to SSH whitelist
3. Remove `0.0.0.0/0` if present

---

## 📊 Post-Deployment Checklist

- [ ] Visit your domain - site loads correctly
- [ ] Test user registration and login
- [ ] Test file uploads (base map, images)
- [ ] Verify email sending works
- [ ] Test plot creation and editing
- [ ] Check map editor functionality
- [ ] Test admin dashboard
- [ ] Verify database backups are running
- [ ] Set up monitoring/error tracking

---

## 🔧 Useful Commands

### SSH into Server
```bash
ssh forge@your-server-ip
```

### Clear All Caches
```bash
cd /home/forge/tajmap.com
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### View Logs
```bash
tail -f storage/logs/laravel.log
```

### Restart Services
```bash
# Via Forge UI or SSH:
sudo service nginx restart
sudo service php8.2-fpm restart
sudo service mysql restart
```

---

## 🐛 Troubleshooting

### 500 Error
1. Check logs in Forge or `storage/logs/laravel.log`
2. Verify `.env` file configuration
3. Run: `php artisan config:cache`

### Database Connection Error
1. Check database credentials in `.env`
2. Verify database exists: `mysql -u forge -p`
3. Check Forge **Database** tab for credentials

### Assets Not Loading
1. Verify `APP_URL` in `.env`
2. Run: `npm run build`
3. Check `public/` directory permissions

### Queue Jobs Not Processing
1. Check queue worker status in Forge
2. Restart queue: `php artisan queue:restart`
3. Check logs: `tail -f storage/logs/laravel.log`

---

## 📈 Monitoring & Maintenance

### Recommended Services

1. **Error Tracking:** Sentry.io (Free tier available)
   ```bash
   composer require sentry/sentry-laravel
   php artisan sentry:publish --dsn=your-dsn
   ```

2. **Uptime Monitoring:** Oh Dear or UptimeRobot (Free tier)

3. **Performance:** New Relic or Laravel Telescope

---

## 🔄 Auto-Deployment Setup

Enable auto-deployment when you push to Git:

1. In Forge, go to **Apps** tab
2. Click **Enable Quick Deploy**
3. Now every push to `main` branch automatically deploys!

---

## 💾 Backup Strategy

### Automatic Backups (via Forge)
- **Database:** Daily at 2 AM, kept for 7 days
- **Storage:** Weekly full backup recommended

### Manual Backup
```bash
# Database
mysqldump -u forge -p forge > backup-$(date +%Y%m%d).sql

# Files
tar -czf files-backup-$(date +%Y%m%d).tar.gz storage/app/public
```

---

## 📞 Getting Help

1. **Laravel Forge Docs:** https://forge.laravel.com/docs
2. **DigitalOcean Docs:** https://docs.digitalocean.com
3. **Laravel Docs:** https://laravel.com/docs
4. **Community:** Laracasts Forum, Laravel.io

---

## 🎉 You're Live!

Congratulations! Your TajMap application is now live on production.

### Next Steps:
1. Set up monitoring
2. Configure regular backups
3. Test all features thoroughly
4. Share with users!
5. Monitor performance and errors

---

## Alternative: Cheaper Shared Hosting Option

If budget is tight, you can use shared hosting:

### Recommended Providers:
1. **Hostinger** - $8/month
2. **A2 Hosting** - $10/month

### Setup Process:
1. Get hosting with SSH access and MySQL
2. Upload files via FTP or Git
3. Import database via phpMyAdmin
4. Configure .env file
5. Run: `composer install --no-dev`
6. Run: `php artisan migrate`
7. Run: `npm run build`

**Note:** Shared hosting has limitations - no queue workers, slower performance.

---

## Need Help?

This guide covers 95% of deployment scenarios. If you encounter issues:
1. Check the Troubleshooting section
2. Review Laravel Forge documentation
3. Ask in Laravel community forums

Good luck with your deployment! 🚀
