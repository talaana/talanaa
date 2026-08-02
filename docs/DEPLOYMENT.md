# Talana — Production Deployment Guide

## Architecture

```
talaana.ir (SPA)          api.talaana.ir (Laravel)
     │                           │
     ├── Nginx serves dist/      ├── PHP-FPM
     │                           │
     └── /api/* → proxy ────────┘
     
*.talaana.ir → resolves tenant by subdomain (wildcard SSL)
```

## Directory Structure on Server

```
/var/www/talaana.ir/
├── html/
│   └── dist/              # Frontend static build
│       ├── index.html
│       ├── assets/
│       └── sw.js
│
└── api/                   # Laravel backend
    ├── .env
    ├── public/
    ├── storage/
    └── ...
```

---

## 1. Frontend Build

```bash
cd /path/to/talana
VITE_API_URL=https://api.talaana.ir/api \
VITE_APP_NAME=Talana \
VITE_BASE_DOMAIN=talaana.ir \
npm run build
```

Output: `dist/` folder (~860 KB) — copy to server.

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

## 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/talaana.ir

server {
    listen 80;
    server_name talaana.ir *.talaana.ir;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name talaana.ir *.talaana.ir;

    # Wildcard SSL from your *.talaana.ir certificate
    ssl_certificate     /etc/ssl/talaana.ir/fullchain.pem;
    ssl_certificate_key /etc/ssl/talaana.ir/privkey.pem;

    root /var/www/talaana.ir/html/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # Static assets (long cache)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker (no cache)
    location = /sw.js {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    # API proxy → Laravel
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback — all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. DNS Configuration

| Type | Name | Value |
|------|------|-------|
| A | `talaana.ir` | Server IP |
| A | `*.talaana.ir` | Server IP |
| A | `api.talaana.ir` | Server IP |

---

## 5. Environment Variables

### Backend (.env.production)

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_URL` | `https://talaana.ir` | |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `DB_CONNECTION` | `mysql` | Change if using PostgreSQL |
| `SESSION_DOMAIN` | `.talaana.ir` | Shared across subdomains |
| `SANCTUM_STATEFUL_DOMAINS` | `talaana.ir,*.talaana.ir` | |
| `TENANT_BASE_DOMAIN` | `talaana.ir` | Subdomain extraction |
| `LOG_CHANNEL` | `daily` | |
| `LOG_LEVEL` | `warning` | |

### Frontend (build-time)

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

# Subdomain resolution
curl https://talana.talaana.ir/
# Should load the SPA with Talana marketplace

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
