# Talana — Production Deployment Guide

## Architecture

```
talana-sage.vercel.app (SPA on Vercel)  →  api.talaana.ir (Laravel Backend)
     │                                              │
     └── API calls (CORS) ──────────────────────────┘
     
*.talaana.ir → resolves tenant by subdomain (wildcard SSL)
Backend + wildcard subdomains remain on talaana.ir
Frontend is now deployed on Vercel (talana-sage.vercel.app)
```

## Directory Structure on Server

```
/var/www/talaana.ir/
└── api/                   # Laravel backend
    ├── .env
    ├── public/
    ├── storage/
    └── ...
```

Frontend is deployed to Vercel (no server-side hosting needed).

---

## 1. Frontend (Vercel)

### Automatic Deployment

Push to the main branch and Vercel will auto-build from `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://api.talaana.ir/api",
    "VITE_APP_NAME": "Talana",
    "VITE_BASE_DOMAIN": "talaana.ir"
  }
}
```

### Manual Build (for reference)

```bash
cd /path/to/talana
VITE_API_URL=https://api.talaana.ir/api \
VITE_APP_NAME=Talana \
VITE_BASE_DOMAIN=talaana.ir \
npm run build
```

### Vercel CLI Deploy

```bash
cd D:\talana
vercel --prod
```

The Vercel project is linked: `prj_OIdO5nlixO9QtSvny2TjeDcjAOt2` (org: `team_KW1qIzxU9JxKaoMmI4Y4Y1P3`).

---

## 2. Backend Setup

```bash
cd /var/www/talaana.ir/api

# Copy production config
cp .env.production.example .env

# Edit .env with real credentials
nano .env
# Set: DB_PASSWORD, MAIL_*, APP_KEY

# Generate app key
php artisan key:generate

# Run migrations + seed
php artisan migrate --force
php artisan db:seed --force

# Storage link (if using local uploads)
php artisan storage:link

# Optimize for production
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data .
```

---

## 3. Nginx Configuration (Backend Only)

Since the frontend is now on Vercel, Nginx only serves the Laravel API:

```nginx
# /etc/nginx/sites-available/api.talaana.ir

server {
    listen 80;
    server_name api.talaana.ir;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.talaana.ir;

    ssl_certificate     /etc/ssl/talaana.ir/fullchain.pem;
    ssl_certificate_key /etc/ssl/talaana.ir/privkey.pem;

    root /var/www/talaana.ir/api/public;
    index index.php;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # CORS headers
    add_header Access-Control-Allow-Origin https://talana-sage.vercel.app;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## 4. DNS Configuration

| Type | Name | Value |
|------|------|-------|
| A | `api.talaana.ir` | Server IP |
| A | `*.talaana.ir` | Server IP |

Frontend is hosted on Vercel at `https://talana-sage.vercel.app` — no DNS entry needed on your domain.

---

## 5. Environment Variables

### Backend (.env.production)

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_URL` | `https://api.talaana.ir` | |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `DB_CONNECTION` | `mysql` | Change if using PostgreSQL |
| `SESSION_DOMAIN` | `.talaana.ir` | Shared across subdomains |
| `SANCTUM_STATEFUL_DOMAINS` | `talaana.ir,*.talaana.ir,talana-sage.vercel.app` | |
| `TENANT_BASE_DOMAIN` | `talaana.ir` | Subdomain extraction |
| `CORS_ALLOWED_ORIGINS` | `https://talana-sage.vercel.app,https://talaana.ir` | |
| `LOG_CHANNEL` | `daily` | |
| `LOG_LEVEL` | `warning` | |

### Frontend (Vercel env vars — set in Vercel dashboard or via CLI)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.talaana.ir/api` |
| `VITE_APP_NAME` | `Talana` |
| `VITE_BASE_DOMAIN` | `talaana.ir` |

---

## 6. Post-Deploy Verification

```bash
# Check backend health
curl https://api.talaana.ir/api/up

# Tenant resolution
curl https://api.talaana.ir/api/tenants/resolve?slug=talana

# Subdomain resolution (still works via *.talaana.ir)
curl https://talana.talaana.ir/
# Should redirect via CNAME/DNS or the wildcard still resolves

# Vercel frontend
curl https://talana-sage.vercel.app/
# Should load the SPA landing page

# Production tests
php artisan test
# Expected: 125 passed (386 assertions)
```

---

## 7. Cron Jobs

```bash
# Laravel scheduler (every minute)
* * * * * cd /var/www/talaana.ir/api && php artisan schedule:run >> /dev/null 2>&1
```

---

## 8. Rollback

```bash
# Frontend: replace dist/ with previous build
# Backend: 
php artisan migrate:rollback --step=1
# Restore from backup
```
