# Talana — Local Development Guide

Multi-tenant SaaS platform for gold & silver trading. Supports two business modes:
- **Marketplace** — multi-vendor bazaar (buyers browse products from multiple sellers)
- **Standalone Store** — single-vendor online shop (one business, own product catalog)

---

## Project Structure

```
talana/                    Frontend (React 19 + Vite + TypeScript + Tailwind 4)
talana-backend/            Backend (Laravel 13 API + SQLite + Sanctum auth)
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node.js |
| PHP | 8.1+ | [windows.php.net](https://windows.php.net) or [Laravel Herd](https://herd.laravel.com) |
| Composer | 2+ | [getcomposer.org](https://getcomposer.org) |
| Git | any | [git-scm.com](https://git-scm.com) |

**Windows note:** All terminal commands use Git Bash (MSYS). For PHP commands, prefix with `cmd /c "..."` if PHP isn't on your Git Bash PATH. Herd users: PHP is at `C:\Users\<user>\.config\herd\bin\php.bat`.

---

## 1. Clone Both Repos

```bash
git clone https://github.com/EhsunM0radi/talana.git
git clone https://github.com/EhsunM0radi/talana-backend.git
```

---

## 2. Backend Setup

```bash
cd talana-backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Create SQLite database
touch database/database.sqlite

# Run migrations and seed demo data
php artisan migrate --seed

# Start the dev server
php artisan serve --port=8000
```

**What the seeder creates:**
- 1 demo user: `09123456789` / `password` (superadmin, full platform access)
- 4 store tenants with their own admin users
- 1 main platform tenant (`طلانا`)
- Categories, products, sellers, prices, banners, transactions
- ACL: permissions, roles, superadmin

**Verify:** Open `http://localhost:8000/api/tenants/directory` — you should see 5 active tenants.

---

## 3. Frontend Setup

```bash
cd talana

# Install dependencies
npm install

# (Optional) Set Gemini API key for AI features
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start dev server
npm run dev -- --port=5175 --host=0.0.0.0
```

The frontend auto-connects to `http://localhost:8000/api`. To point to a different backend:

```bash
VITE_API_URL=http://other-host:8000/api npm run dev -- --port=5175
```

**Open:** `http://localhost:5175`

---

## 4. Tenant-Aware Access (SaaS Modes)

The app detects which tenant/store to display using three methods:

### Dev Mode — Query Param

```
http://localhost:5175/?tenant=zarrin       → گالری زرین (standalone store)
http://localhost:5175/?tenant=nab           → طلای ناب (standalone store)
http://localhost:5175                       → طلانا (main marketplace, no tenant param)
```

### Production Mode — Subdomain

```
zarrin.talana.app     → گالری زرین
nab.talana.app        → طلای ناب
talana.app            → طلانا (main platform)
```

### Path Prefix Mode

```
talana.app/s/zarrin   → گالری زرین
```

---

## 5. Test Accounts

### Superadmin (full platform control)

| Phone | Password | Role |
|-------|----------|------|
| `09123456789` | `password` | سوپر ادمین |

Log in at `http://localhost:5175`, then navigate to `#/admin` for the admin panel.

### Store Admins (tenant-level management)

| Phone | Password | Store | Type |
|-------|----------|-------|------|
| `09121000000` | `password` | گالری زرین | store |
| `09121000001` | `password` | جواهری محمد | store |
| `09121000002` | `password` | طلای ناب | store |
| `09121000003` | `password` | طلا و جواهر مهر | store |

---

## 6. Running Tests

```bash
cd talana-backend

# Run all tests
php artisan test

# Run a specific test file
php artisan test --filter=AuthAndTenantTest
php artisan test --filter=MarketplaceBuyerJourneyTest
php artisan test --filter=StandaloneStoreJourneyTest
```

Test database uses SQLite in-memory (`:memory:`) — no setup needed. Tests use `RefreshDatabase` so each test starts clean.

---

## 7. Useful Commands

### Frontend

```bash
npm run dev              # Dev server (default port 3000)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # TypeScript type-check
```

### Backend

```bash
php artisan serve --port=8000              # Start API server
php artisan migrate:fresh --seed            # Reset DB + re-seed
php artisan route:list                      # List all API routes
php artisan test                            # Run test suite
php artisan tinker                           # Interactive REPL
```

---

## 8. Quick Start (Two Terminals)

**Terminal 1 — Backend:**
```bash
cd talana-backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve --port=8000
```

**Terminal 2 — Frontend:**
```bash
cd talana
npm install
npm run dev -- --port=5175 --host=0.0.0.0
```

Then open `http://localhost:5175` in your browser.

---

## 9. Troubleshooting

### Port 5175 or 8000 already in use

```bash
# Find the process
netstat -ano | grep ":5175"

# Kill it (Windows Git Bash)
cmd /c "taskkill /F /PID <PID>"
```

### "SQLite database not found"

```bash
cd talana-backend
touch database/database.sqlite
php artisan migrate --seed
```

### "php: command not found" in Git Bash

PHP isn't on your Git Bash PATH. Either:
- Use Laravel Herd and prepend `cmd /c "..."` to PHP commands
- Add PHP to your Windows PATH and restart Git Bash

### CORS errors in browser

Make sure the backend is running on port 8000 and `VITE_API_URL` is set correctly. By default, the frontend connects to `http://localhost:8000/api`.

### "npm install" fails

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Vite dev server not starting"

Check Node.js version: `node --version` (needs 18+). If using a port already in use, pass a different port: `npm run dev -- --port=5176`.

---

## 10. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Laravel 13, PHP 8.1+, SQLite |
| Auth | Laravel Sanctum (token-based) |
| UI | Lucide React icons, Motion (Framer Motion) |
| Font | Vazirmatn (Persian) |
| AI | Google Gemini API |
| Testing | PHPUnit 12, RefreshDatabase |
| Deploy | Vercel (frontend), any PHP host (backend) |

---

## 11. API Overview

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get token |
| GET | `/api/tenants/resolve?slug=X` | Resolve tenant by slug |
| GET | `/api/tenants/resolve?domain=X` | Resolve tenant by domain |
| GET | `/api/tenants/directory` | List all active stores |
| GET | `/api/products?metal=gold` | Browse products |
| GET | `/api/products/{id}` | Product detail |
| GET | `/api/sellers` | List sellers |
| GET | `/api/categories` | List categories |
| GET | `/api/prices/current` | Live gold/silver prices |
| GET | `/api/banners` | Promotional banners |

### Authenticated (Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/profile` | User profile + wallet |
| PUT | `/api/auth/profile` | Update name |
| PUT | `/api/auth/password` | Change password |
| POST | `/api/auth/logout` | Logout (deletes token) |
| GET | `/api/wallet` | Wallet balance |
| GET/POST | `/api/transactions` | Transaction history / create |
| GET/POST | `/api/auto-orders` | Recurring buy orders |
| POST | `/api/loans/calculate` | Loan against gold collateral |
| POST | `/api/installments/calculate` | Installment plan for product |
| POST | `/api/gift-cards` | Send gift card |
| POST | `/api/deliveries` | Request physical delivery |
| GET/POST/DELETE | `/api/bank-accounts` | Manage bank accounts |

### Admin (Bearer + `admin.access` permission)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/tenants` | List / create tenants |
| GET/PUT | `/api/admin/tenants/{id}` | View / update tenant |
| PUT | `/api/admin/tenants/{id}/toggle` | Toggle active/inactive |
| POST | `/api/admin/tenants/{id}/impersonate` | Superadmin impersonation |
| GET/POST/PUT/DELETE | `/api/admin/roles` | Role CRUD |
| GET/PUT | `/api/admin/users` | User management |
| GET | `/api/admin/dashboard/stats` | Platform stats |
| GET | `/api/admin/dashboard/permissions` | Current user perms |
