# Talana — Production Deployment Guide

## Architecture

```
app.talaana.ir / *.talaana.ir (SPA dist on the VPS)  →  api.talaana.ir (Laravel Backend)
     │                                              │
     └── API calls (CORS) ──────────────────────────┘
     
*.talaana.ir → resolves tenant by subdomain (wildcard SSL)
Backend + wildcard subdomains remain on talaana.ir
Frontend is served from the VPS; vercel.json is a build input, not the origin
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

The SPA is served by nginx on the VPS from `/home/talana/www/talana-frontend/dist`
for `talaana.ir`, `app.talaana.ir` and `*.talaana.ir`. `vercel.json` stays in the
repo as a second build input for the same bundle — a Vercel build reads its `env`
block, not `.env.production.example`. Nothing in `/etc/nginx/sites-available/`
points at a Vercel host, and `src/host.ts:21` lists `talana-sage.vercel.app` among
`LEGACY_BASE_DOMAINS`, so the VPS is the production origin for this SPA.

---

## Build inputs

`dist/` is built on a laptop, never on the VPS (the build OOMs 3.8 GiB with no
swap). The four values in `.env.production.example` are the whole contract:
`VITE_BASE_DOMAIN` decides where tenant hosts live (`{slug}.talaana.ir`, and
`app.talaana.ir` for the marketplace tenant) and `VITE_PLATFORM_DOMAIN` decides
the platform hosts (`app.zaraasan.ir`, `sa.zaraasan.ir`, and the `zaraasan.ir`
landing). A Vercel build reads `vercel.json`'s `env` block instead, so those four
values are mirrored there; the two must stay equal. The server's untracked
`.env.production` is not a template and must not be used to rebuild the split —
check it against `.env.production.example` before every release; it equals the
example today, and a build from a drifted copy is how the split reverts.
Host interpretation lives in `src/host.ts`; see `docs/host-surface-model.md`.

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

The block below serves only the Laravel API. The SPA is served from its own vhost
(`talana-frontend`), rooted at `/home/talana/www/talana-frontend/dist`:

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

A Vercel deployment of the same bundle lives at `https://talana-sage.vercel.app`
(the linked project in §1). It is not the origin for the tenant or platform
hostnames: `talaana.ir`, `*.talaana.ir`, `zaraasan.ir` and `*.zaraasan.ir` reach
this server through WCDN, and the vhosts in `D:/talana/deploy` are what answer.

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
| `VITE_PLATFORM_DOMAIN` | `zaraasan.ir` |

These are the same four values as `.env.production.example` and `vercel.json`'s `env`
block. The Vercel dashboard is not in this repo, so confirm it carries
`VITE_PLATFORM_DOMAIN` before trusting a Vercel-built bundle: a missing value falls
back to `src/host.ts`'s default, which is correct today and silent the day it is not.

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

# Production SPA (nginx on the VPS, behind WCDN)
curl -sI https://app.talaana.ir/

# Legacy Vercel deployment of the same bundle, not the production origin
curl https://talana-sage.vercel.app/
# Both load the SPA, and neither response proves which vhost answered: behind WCDN
# the only evidence is the log line. Read host= and sni= in
# /var/log/nginx/*-access.log; nginx/zaraasan-platform.conf in D:/talana/deploy
# defines the log_format that records them.

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
