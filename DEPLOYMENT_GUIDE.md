# TajMap Deployment Guide

This guide provides two deployment options:
1. **Manual Setup on DigitalOcean Ubuntu** (Full control, requires server knowledge)
2. **Laravel Forge + DigitalOcean** (Automated, beginner-friendly)

Choose based on your experience and requirements.

---

## 📋 Prerequisites Checklist

Before deployment, ensure you have:

- [ ] GitHub/GitLab/Bitbucket account with your code pushed
- [ ] DigitalOcean account (or any VPS provider)
- [ ] Domain name purchased (e.g., tajmap.com)
- [ ] Credit card for hosting payments
- [ ] Email address for SSL certificates
- [ ] SSH client (Terminal on Mac/Linux, PuTTY on Windows)

---

## 💰 Cost Breakdown

### Option 1: Manual Setup (DIY)
| Service | Cost | Purpose |
|---------|------|---------|
| DigitalOcean Droplet | $24/month | Server (4GB RAM, 2 vCPU) |
| Domain Name | $10-15/year | yoursite.com |
| **Total** | **~$24/month** | Full control, no management fee |

### Option 2: Laravel Forge + DigitalOcean
| Service | Cost | Purpose |
|---------|------|---------|
| Laravel Forge | $12/month | Server management |
| DigitalOcean Droplet | $24/month | Server (4GB RAM) |
| Domain Name | $10-15/year | yoursite.com |
| **Total** | **~$36/month** | Automated deployment |

### Can I Start Cheaper?
Yes! Start with $12/month DigitalOcean droplet (2GB RAM) for lighter traffic.
Upgrade when you get more users.

---

## 🚀 OPTION 1: Manual Deployment on Ubuntu Server

This comprehensive guide will walk you through deploying TajMap on a fresh Ubuntu 22.04/24.04 server from DigitalOcean.

### Part A: Server Setup & Initial Configuration

#### Step 1: Create DigitalOcean Droplet

1. Go to [DigitalOcean](https://digitalocean.com) and sign in
2. Click **Create → Droplets**
3. Choose these settings:
   ```
   Image: Ubuntu 24.04 LTS x64
   Plan: Basic
   CPU Options: Regular
   Size: $24/month (4GB RAM / 2 vCPUs)
   Datacenter: Choose closest to your users
   Authentication: SSH Key (recommended) or Password
   Hostname: tajmap-production
   ```
4. Click **Create Droplet** (takes ~1 minute)
5. Note your server's IP address (e.g., 203.0.113.45)

#### Step 2: Initial Server Access

```bash
# SSH into your server (replace with your IP)
ssh root@203.0.113.45

# Update system packages
apt update && apt upgrade -y
```

#### Step 3: Create Non-Root User

```bash
# Create new user (replace 'deploy' with your preferred username)
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Switch to new user
su - deploy
```

#### Step 4: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify firewall status
sudo ufw status
```

### Part B: Install Required Software

#### Step 5: Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation (visit http://YOUR_IP in browser)
```

#### Step 6: Install MySQL

```bash
# Install MySQL
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation
# Answer:
#   - Setup VALIDATE PASSWORD component? No
#   - Set root password? Yes (choose strong password)
#   - Remove anonymous users? Yes
#   - Disallow root login remotely? Yes
#   - Remove test database? Yes
#   - Reload privilege tables? Yes

# Create database and user
sudo mysql -u root -p

# Run these SQL commands (replace passwords):
CREATE DATABASE tajmap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tajmap_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON tajmap.* TO 'tajmap_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 7: Install PHP 8.2 and Extensions

```bash
# Add PHP repository
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 and required extensions
sudo apt install php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath \
php8.2-curl php8.2-zip php8.2-gd php8.2-intl php8.2-redis php8.2-cli -y

# Verify PHP installation
php -v
```

#### Step 8: Install Composer

```bash
# Download and install Composer
cd ~
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php

# Verify Composer
composer --version
```

#### Step 9: Install Node.js and NPM

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Verify installation
node -v
npm -v
```

#### Step 10: Install Redis (for cache and queues)

```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis to start on boot
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Step 11: Install Git

```bash
sudo apt install git -y
git --version
```

### Part C: Deploy Laravel Application

#### Step 12: Clone Your Repository

```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your repo URL)
sudo git clone https://github.com/yourusername/TajMap.git tajmap
sudo chown -R deploy:deploy tajmap
cd tajmap
```

#### Step 13: Install Dependencies

```bash
# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node dependencies
npm ci

# Build frontend assets
npm run build
```

#### Step 14: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit environment file
nano .env
```

Update the following in `.env`:

```env
APP_NAME=TajMap
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tajmap
DB_USERNAME=tajmap_user
DB_PASSWORD=your_strong_password_here

SESSION_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Google Sheets (if you're using it)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SYNC_ENABLED=false
```

Save and exit (Ctrl+X, Y, Enter)

#### Step 15: Generate Application Key and Setup

```bash
# Generate application key
php artisan key:generate

# Create storage link
php artisan storage:link

# Run migrations
php artisan migrate --force

# Seed database (optional, if you have seeders)
php artisan db:seed --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### Step 16: Set Permissions

```bash
# Set proper ownership
sudo chown -R deploy:www-data /var/www/tajmap

# Set proper permissions
sudo find /var/www/tajmap -type f -exec chmod 644 {} \;
sudo find /var/www/tajmap -type d -exec chmod 755 {} \;

# Give write permission to storage and cache
sudo chmod -R 775 /var/www/tajmap/storage
sudo chmod -R 775 /var/www/tajmap/bootstrap/cache
```

### Part D: Configure Nginx

#### Step 17: Create Nginx Configuration

```bash
# Create Nginx config file
sudo nano /etc/nginx/sites-available/tajmap
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/tajmap/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Increase upload size for images
    client_max_body_size 20M;
}
```

Save and exit (Ctrl+X, Y, Enter)

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tajmap /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 18: Configure Domain DNS

Go to your domain registrar and add these DNS records:

```
Type    Name    Value               TTL
A       @       203.0.113.45        3600
A       www     203.0.113.45        3600
```

Wait 5-10 minutes for DNS to propagate. Test by visiting http://yourdomain.com

### Part E: Install SSL Certificate

#### Step 19: Install Certbot and Get SSL

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
#   - Enter email address
#   - Agree to terms
#   - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Part F: Setup Queue Workers and Scheduler

#### Step 20: Create Supervisor Configuration for Queue Worker

```bash
# Install Supervisor
sudo apt install supervisor -y

# Create supervisor config
sudo nano /etc/supervisor/conf.d/tajmap-worker.conf
```

Paste this configuration:

```ini
[program:tajmap-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/tajmap/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/tajmap/storage/logs/worker.log
stopwaitsecs=3600
```

Save and exit.

```bash
# Reload Supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tajmap-worker:*

# Check status
sudo supervisorctl status
```

#### Step 21: Setup Laravel Scheduler

```bash
# Edit crontab for deploy user
crontab -e

# Add this line at the end:
* * * * * cd /var/www/tajmap && php artisan schedule:run >> /dev/null 2>&1
```

Save and exit.

### Part G: Security Hardening

#### Step 22: Additional Security Measures

```bash
# Disable password authentication for SSH (if using SSH keys)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Save and restart SSH: sudo systemctl restart sshd

# Install fail2ban to prevent brute force attacks
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure PHP for production
sudo nano /etc/php/8.2/fpm/php.ini
# Find and set:
#   expose_php = Off
#   display_errors = Off
#   log_errors = On
#   upload_max_filesize = 20M
#   post_max_size = 20M

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

### Part H: Monitoring and Backups

#### Step 23: Setup Automated Database Backups

```bash
# Create backup directory
mkdir -p /home/deploy/backups

# Create backup script
nano /home/deploy/backup.sh
```

Paste this script:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/deploy/backups"
DB_NAME="tajmap"
DB_USER="tajmap_user"
DB_PASS="your_strong_password_here"

# Create backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

Save and exit.

```bash
# Make script executable
chmod +x /home/deploy/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add:
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backups/backup.log 2>&1
```

#### Step 24: Setup Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/tajmap
```

Paste this:

```
/var/www/tajmap/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy www-data
    sharedscripts
}
```

### Part I: Deployment Script for Updates

#### Step 25: Create Deployment Script

```bash
# Create deployment script
nano /home/deploy/deploy.sh
```

Paste this:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

cd /var/www/tajmap

# Enable maintenance mode
php artisan down

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Clear application cache
php artisan cache:clear

# Restart queue workers
sudo supervisorctl restart tajmap-worker:*

# Disable maintenance mode
php artisan up

echo "Deployment completed successfully!"
```

Save and exit.

```bash
# Make executable
chmod +x /home/deploy/deploy.sh

# Deploy future updates with:
# /home/deploy/deploy.sh
```

### Part J: Testing & Verification

#### Step 26: Post-Deployment Checklist

```bash
# Test database connection
php artisan tinker
# Type: DB::connection()->getPdo();
# Should not throw errors

# Test Redis
redis-cli ping

# Check queue workers
sudo supervisorctl status

# View logs
tail -f /var/www/tajmap/storage/logs/laravel.log

# Check disk space
df -h

# Check memory usage
free -m
```

Visit your website and test:
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] Login works
- [ ] Map editor functions
- [ ] Plot creation/editing
- [ ] Image uploads
- [ ] Admin dashboard
- [ ] SSL certificate is active (https://)

### Part K: Troubleshooting

#### Common Issues and Solutions

**500 Internal Server Error**
```bash
# Check Laravel logs
tail -f /var/www/tajmap/storage/logs/laravel.log

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify permissions
sudo chown -R deploy:www-data /var/www/tajmap
sudo chmod -R 775 /var/www/tajmap/storage
```

**Database Connection Issues**
```bash
# Test MySQL connection
mysql -u tajmap_user -p tajmap

# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in .env file
nano /var/www/tajmap/.env
```

**Queue Jobs Not Processing**
```bash
# Check supervisor status
sudo supervisorctl status

# Restart workers
sudo supervisorctl restart tajmap-worker:*

# Check worker logs
tail -f /var/www/tajmap/storage/logs/worker.log
```

**Assets Not Loading**
```bash
# Rebuild assets
cd /var/www/tajmap
npm run build

# Clear cache
php artisan cache:clear
php artisan config:clear
```

### Part L: Maintenance Commands

```bash
# View application logs
tail -f /var/www/tajmap/storage/logs/laravel.log

# View worker logs
tail -f /var/www/tajmap/storage/logs/worker.log

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart mysql
sudo supervisorctl restart tajmap-worker:*

# Update application
cd /var/www/tajmap
git pull
composer install --no-dev
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
```

---

## 🚀 OPTION 2: Laravel Forge + DigitalOcean (Automated)

For those who prefer automated server management, Laravel Forge is an excellent option.

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
