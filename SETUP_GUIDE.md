# TajMap - Real Estate Plot Booking and Management System

## Complete Implementation Guide

A comprehensive real estate plot booking and management system built with Laravel 12 + React, featuring an interactive HTML5 Canvas plot viewer/editor, lead management with Kanban board, advanced analytics, and role-based access control.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [System Requirements](#system-requirements)
4. [Installation](#installation)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Structure](#frontend-structure)
8. [Canvas Implementation](#canvas-implementation)
9. [Security Features](#security-features)
10. [Usage Guide](#usage-guide)
11. [Development Notes](#development-notes)

---

## Features

### Public Features
- **Interactive Plot Viewer**: HTML5 Canvas-based map with zoom, pan, hover, and click interactions
- **Advanced Search**: Filter by sector, block, status, price range, and area
- **Lead Submission**: Public form with rate limiting (5 requests/minute)
- **Responsive Design**: Mobile-friendly interface

### User Features
- **User Dashboard**: Overview of saved plots and activities
- **Saved Plots**: Bookmark favorite plots for quick access
- **Authentication**: Secure login/registration with Laravel Sanctum

### Admin Features
- **Plot Management**: Full CRUD with Canvas-based editor
  - Drawing tools: Polygon, Rectangle, Freeform
  - Vertex editing, move, rotate, duplicate
  - Undo/redo stack
  - Base map image upload with transformations
- **Lead Management**: Kanban board with drag-and-drop
  - 4 columns: New, Contacted, Interested, Closed
  - Lead assignment to admins
  - Activity history timeline
  - Lead scoring system (0-100)
- **Analytics Dashboard**:
  - Real-time metrics cards
  - Plot distribution charts (Recharts)
  - Monthly trends (line charts)
  - Admin performance tracking
- **Settings Management**: Key-value configuration
- **User Management**: Admin users with role management
- **Export Functionality**: CSV and JSON exports for leads

---

## Tech Stack

### Backend
- **Framework**: Laravel 12
- **PHP**: 8.2+
- **Authentication**: Laravel Sanctum (API tokens)
- **Database**: MySQL/PostgreSQL
- **Validation**: Form Request classes
- **Authorization**: Policies and Gates
- **API Resources**: Data transformation layer

### Frontend
- **Framework**: React 19
- **Router**: React Router DOM
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **UI**: Tailwind CSS v4
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Notifications**: React Hot Toast
- **Icons**: Heroicons

---

## System Requirements

- **PHP**: 8.2 or higher
- **Composer**: Latest version
- **Node.js**: 18+
- **NPM**: 9+
- **Database**: MySQL 8.0+ or PostgreSQL 13+
- **Web Server**: Apache/Nginx (with proper PHP-FPM configuration)

---

## Installation

### 1. Clone or Setup Project

```bash
cd C:\laragon\www\TajMap
```

### 2. Install Dependencies

**Important**: You need PHP 8.2+ to be active in your PATH.

```bash
# Install PHP dependencies (requires PHP 8.2+)
composer install

# Install Node dependencies
npm install --legacy-peer-deps
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

**Update `.env` file:**

```env
APP_NAME="TajMap Real Estate"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tajmap
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,127.0.0.1:8000
SESSION_DRIVER=cookie
```

### 4. Database Setup

```bash
# Create database (if using MySQL command line)
mysql -u root -p
CREATE DATABASE tajmap;
EXIT;

# Run migrations
php artisan migrate

# Seed database with admin user and sample plots
php artisan db:seed
```

**Default Credentials:**
- **Admin**: admin@tajmap.com / password
- **User**: user@tajmap.com / password

### 5. Storage Setup

```bash
# Create storage link for media uploads
php artisan storage:link
```

### 6. Start Development Servers

```bash
# Option 1: Start all services (recommended)
php artisan serve &
npm run dev

# Option 2: Using separate terminals
# Terminal 1:
php artisan serve

# Terminal 2:
npm run dev
```

### 7. Access Application

- **Public Site**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/dashboard
- **API**: http://localhost:8000/api

---

## Database Schema

### Tables Overview

1. **users**
   - Extended with: `phone`, `role` (enum: admin/user), `last_active_at`

2. **plots**
   ```sql
   - id (PK)
   - plot_number (unique)
   - sector, block
   - coordinates (JSON) - Array of {x, y} normalized to 0-1
   - status (enum: available/reserved/sold)
   - area (decimal)
   - price (decimal)
   - base_image_id (FK to media)
   - base_image_transform (JSON) - {x, y, scale, rotation}
   - description, features (JSON)
   - soft_deletes, timestamps
   ```

3. **leads**
   ```sql
   - id (PK)
   - plot_id (FK), admin_user_id (FK)
   - name, phone, email, message
   - status (enum: new/contacted/interested/closed)
   - score (0-100 calculated automatically)
   - metadata (JSON)
   - soft_deletes, timestamps
   ```

4. **lead_histories**
   ```sql
   - id (PK)
   - lead_id (FK), user_id (FK)
   - action, details, metadata (JSON)
   - timestamps
   ```

5. **saved_plots** (pivot)
   ```sql
   - user_id, plot_id (composite unique)
   - timestamps
   ```

6. **media**
   ```sql
   - id (PK)
   - name, file_name, mime_type, path, disk, size
   - type (base_map, plot_image, other)
   - uploaded_by (FK)
   - timestamps
   ```

7. **settings**
   ```sql
   - id (PK)
   - key (unique), value, type, group
   - label, description
   - timestamps
   ```

8. **personal_access_tokens** (Sanctum)

---

## API Endpoints

### Public Endpoints

```
GET    /api/public/plots              # List plots with filters
GET    /api/public/plots/{id}         # Get plot details
GET    /api/public/plots/meta/sectors # Get unique sectors
GET    /api/public/plots/meta/blocks  # Get blocks by sector
POST   /api/public/leads              # Submit lead (rate limited)
```

### Authentication

```
POST   /api/auth/register             # Register new user
POST   /api/auth/login                # Login
POST   /api/auth/logout               # Logout (auth required)
GET    /api/auth/me                   # Get current user
```

### User Endpoints (auth required)

```
GET    /api/user/dashboard            # User dashboard
GET    /api/user/saved-plots          # Get saved plots
POST   /api/user/saved-plots/{plot}   # Save a plot
DELETE /api/user/saved-plots/{plot}   # Remove saved plot
```

### Admin Endpoints (admin role required)

#### Plots
```
GET    /api/admin/plots               # List plots
POST   /api/admin/plots               # Create plot
GET    /api/admin/plots/{id}          # Get plot
PUT    /api/admin/plots/{id}          # Update plot
DELETE /api/admin/plots/{id}          # Soft delete plot
POST   /api/admin/plots/{id}/restore  # Restore deleted plot
```

#### Leads
```
GET    /api/admin/leads               # List leads
GET    /api/admin/leads/{id}          # Get lead with history
PUT    /api/admin/leads/{id}          # Update lead
DELETE /api/admin/leads/{id}          # Delete lead
POST   /api/admin/leads/{id}/assign   # Assign to admin
POST   /api/admin/leads/{id}/status   # Update status
POST   /api/admin/leads/{id}/notes    # Add note
GET    /api/admin/leads/export/csv    # Export CSV
GET    /api/admin/leads/export/json   # Export JSON
```

#### Analytics
```
GET    /api/admin/analytics/dashboard        # Dashboard stats
GET    /api/admin/analytics/monthly-trends   # Monthly trends
GET    /api/admin/analytics/admin-performance # Admin performance
GET    /api/admin/analytics/plot-distribution # Plot distribution
```

#### Media, Settings, Users
```
GET/POST/DELETE /api/admin/media
GET/POST/PUT/DELETE /api/admin/settings
POST   /api/admin/settings/bulk-update
GET    /api/admin/settings/group/{group}
GET/POST/PUT/DELETE /api/admin/users
```

---

## Frontend Structure

```
resources/js/
├── components/
│   ├── App.jsx                    # Main app with routing
│   ├── ProtectedRoute.jsx         # Auth guard
│   ├── AdminRoute.jsx             # Admin guard
│   ├── PlotViewer.jsx             # Canvas plot viewer
│   └── PlotEditor.jsx             # Canvas plot editor
├── layouts/
│   └── AdminLayout.jsx            # Admin panel layout
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── public/
│   │   ├── LandingPage.jsx
│   │   └── PlotListPage.jsx
│   ├── user/
│   │   ├── UserDashboard.jsx
│   │   └── UserSavedPlots.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminPlots.jsx
│       ├── AdminLeads.jsx
│       ├── AdminAnalytics.jsx
│       ├── AdminSettings.jsx
│       └── AdminUsers.jsx
├── store/
│   ├── authStore.js               # Zustand auth state
│   ├── plotStore.js               # Zustand plot state
│   └── leadStore.js               # Zustand lead state
├── services/
│   └── api.js                     # Axios instance + services
└── app.jsx                        # Entry point
```

---

## Canvas Implementation

### Plot Viewer Features

**Coordinates**: Normalized to 0-1 range for storage
```javascript
// Storage format
{
  "coordinates": [
    {"x": 0.25, "y": 0.30},
    {"x": 0.30, "y": 0.30},
    {"x": 0.30, "y": 0.35},
    {"x": 0.25, "y": 0.35}
  ]
}
```

**Transform Matrix**:
```javascript
{
  x: 0,      // Pan X
  y: 0,      // Pan Y
  scale: 1   // Zoom level (0.5 - 5.0)
}
```

**Color Coding**:
- Available: Green (#22c55e)
- Reserved: Yellow (#fbbf24)
- Sold: Red (#ef4444)

**Interactions**:
- Click & Drag: Pan the map
- Mouse Wheel: Zoom in/out
- Hover: Show plot tooltip
- Click on plot: Select/view details

### Plot Editor Features

**Drawing Modes**:
1. **Select**: Default mode for navigation
2. **Polygon**: Click to add vertices, Enter/double-click to complete
3. **Rectangle**: Click and drag to create
4. **Edit**: Select plot to edit vertices

**Keyboard Shortcuts**:
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Delete`: Delete selected plot
- `Ctrl+D`: Duplicate selected plot
- `Escape`: Cancel current action
- `Enter`: Complete polygon (in polygon mode)

**History Stack**: Supports undo/redo for all operations

---

## Security Features

### CSRF Protection
- Laravel Sanctum handles CSRF tokens for SPA
- Configured in `config/sanctum.php`

### SQL Injection Prevention
- All queries use Eloquent ORM
- Form Requests validate input

### XSS Prevention
- API Resources sanitize output
- React escapes content by default

### Authorization
- Policies for all models (PlotPolicy, LeadPolicy, etc.)
- Gates for admin access
- Route middleware: `auth:sanctum` and custom admin checks

### Rate Limiting
- Lead submission: 5 requests/minute
- Configured in routes/api.php

### File Upload Validation
- Max size: 10MB
- Allowed types: jpg, jpeg, png, gif, webp
- Stored with random filenames

### Password Security
- Hashed using Laravel's Hash facade (bcrypt)
- Password confirmation required for registration

---

## Usage Guide

### For Administrators

#### 1. Managing Plots

**Create a Plot:**
1. Navigate to Admin Panel > Plots
2. Click "Create Plot"
3. Use Canvas editor to draw the plot:
   - Select Polygon/Rectangle tool
   - Draw on canvas
   - Click "Save" to finalize
4. Fill in plot details:
   - Plot Number (required, unique)
   - Sector, Block
   - Area, Price
   - Status
   - Description, Features
5. Save the plot

**Edit a Plot:**
1. Find plot in the list
2. Click "Edit"
3. Modify coordinates using Canvas editor or update details
4. Save changes

#### 2. Managing Leads

**Kanban Board:**
- Leads are organized in 4 columns: New, Contacted, Interested, Closed
- Drag and drop leads between columns to update status
- Click on a lead to view details and history

**Lead Assignment:**
1. Open lead details
2. Select admin from dropdown
3. Click "Assign"

**Add Notes:**
1. Open lead details
2. Scroll to notes section
3. Enter note and click "Add"

**Export Leads:**
1. Navigate to Leads page
2. Apply filters if needed
3. Click "Export" > Choose CSV or JSON

#### 3. Analytics

View comprehensive analytics:
- Plot distribution by status, sector, block
- Monthly lead trends
- Admin performance metrics
- Conversion rates

### For Users

#### 1. Browsing Plots

1. Navigate to "Browse Plots"
2. Use filters:
   - Status (Available/Reserved/Sold)
   - Sector, Block
   - Price range, Area range
3. Switch between Map View and List View
4. Click on a plot to inquire

#### 2. Saving Plots

1. While browsing plots, click the "Save" icon
2. Access saved plots from User Dashboard
3. Remove plots from saved list anytime

#### 3. Submitting Inquiries

1. Click "Inquire" on any plot
2. Fill in the form:
   - Name (required)
   - Phone (required)
   - Email (optional)
   - Message (optional)
3. Submit

---

## Development Notes

### Adding New Features

#### New API Endpoint

1. Create Form Request: `app/Http/Requests/`
2. Create Resource: `app/Http/Resources/`
3. Add Controller method: `app/Http/Controllers/Api/`
4. Define route in `routes/api.php`
5. Add service method in `resources/js/services/api.js`

#### New Page

1. Create component in `resources/js/pages/`
2. Add route in `resources/js/components/App.jsx`
3. Create corresponding API service if needed

### State Management

Use Zustand for global state:
```javascript
import { useAuthStore } from '../store/authStore';

const { user, setAuth, clearAuth } = useAuthStore();
```

### API Calls

Use service layer:
```javascript
import { plotService } from '../services/api';

const fetchPlots = async () => {
  const { data } = await plotService.getAll({ status: 'available' });
  setPlots(data.data);
};
```

### Canvas Development Tips

1. **Always normalize coordinates before saving**
2. **Use transform matrix for zoom/pan**
3. **Implement proper hit detection for polygons**
4. **Test on different screen sizes**
5. **Add touch event handlers for mobile**

### Database Optimization

Indexes are created on frequently queried columns:
- plots: `[status, sector, block]`
- leads: `[status, admin_user_id]`
- lead_histories: `[lead_id]`

### Performance Tips

1. **Pagination**: All list endpoints support pagination
2. **Eager Loading**: Use `with()` to prevent N+1 queries
3. **Caching**: Consider implementing Redis for frequently accessed data
4. **Image Optimization**: Compress uploaded images

---

## Troubleshooting

### Common Issues

**1. "Class not found" errors**
```bash
composer dump-autoload
```

**2. Vite connection refused**
```bash
npm run dev
# Ensure Vite dev server is running
```

**3. CORS errors**
- Check `config/cors.php`
- Verify `SANCTUM_STATEFUL_DOMAINS` in .env

**4. 419 CSRF Token Mismatch**
- Clear browser cookies
- Restart Laravel dev server
- Check Sanctum configuration

**5. Canvas not rendering**
- Check browser console for errors
- Verify plot coordinates are in 0-1 range
- Ensure canvas parent has defined dimensions

---

## Production Deployment

### 1. Environment

```bash
# Update .env for production
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
npm run build
```

### 2. Web Server Configuration

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/tajmap/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 3. Database

- Use connection pooling
- Set up regular backups
- Monitor slow queries

### 4. Security

- Enable HTTPS (Let's Encrypt)
- Set up firewall rules
- Regular security updates
- Monitor logs

---

## License

This project is open-source software licensed under the MIT license.

---

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review Laravel and React documentation

---

**Built with Laravel 12 + React 19 + Tailwind CSS 4**

*Complete real estate management solution with interactive Canvas mapping*