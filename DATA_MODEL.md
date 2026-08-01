# Talana — Data Model & Architecture

Multi-tenant SaaS platform for gold & silver marketplaces and standalone stores.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Tenant** | A business on the platform — can be a marketplace or standalone store |
| **Marketplace** | Multi-vendor platform where multiple sellers list products |
| **Standalone Store** | Single-brand retail shop with its own catalog |
| **User** | A person who logs into the admin panel or customer-facing app |
| **Contact** | A business contact (NOT a user) — suppliers, customers, partners |
| **Seller (غرفه‌دار)** | A vendor inside a marketplace — has a storefront/booth |
| **Role** | A set of permissions assigned to users within a tenant |

---

## Database Schema

### tenants

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| name | string | Business name in Persian |
| slug | string unique | URL-safe identifier |
| type | enum | `marketplace` or `store` |
| domain | string nullable | Custom domain (e.g. `my-store.talana.app`) |
| logo | string nullable | Logo URL |
| settings | json nullable | Arbitrary tenant settings |
| is_active | boolean | Soft disable without deleting |
| created_at / updated_at | timestamps | |

### users

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| name | string | |
| phone | string unique (11 digits) | Used for login |
| password | string | Hashed |
| national_code | string nullable | |
| verification_status | string | `verified`, `pending`, etc. |
| fingerprint_enabled | boolean | |
| referral_code | string | |
| referred_by | string nullable | |
| tenant_id | bigint FK nullable | **Deprecated** — use tenant_user pivot |
| otp_code | string nullable | 6-digit OTP for dev (`111111`) |
| otp_expires_at | timestamp nullable | OTP validity window |
| created_at / updated_at | timestamps | |

### tenant_user (pivot)

Many-to-many between tenants and users.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| user_id | bigint FK → users | |
| role | string | `admin`, `manager`, `staff`, `seller`, `member` |
| created_at / updated_at | timestamps | |

**Unique constraint:** `(tenant_id, user_id)`

### contacts

Business contacts — NOT admin panel users. External parties the business deals with.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | |
| name | string | |
| phone | string(11) nullable | |
| type | enum | See contact types below |
| notes | text nullable | |
| is_active | boolean | |
| created_at / updated_at | timestamps | |

**Contact types:**
| Value | Persian | Description |
|-------|---------|-------------|
| `customer` | مشتری | End customer / buyer |
| `wholesaler` | بنکدار و کیفی | Bulk supplier |
| `melted_gold_seller` | آبشده فروش | Melted gold supplier |
| `goldsmith` | طلاساز | Goldsmith / jewelry maker |
| `coin_seller` | سکه فروش | Coin dealer |
| `money_changer` | صراف | Currency / gold exchange |

### sellers (غرفه‌ها)

Vendors inside a marketplace. Only exist in `type=marketplace` tenants.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| tenant_id | bigint FK → tenants | Which marketplace |
| name | string | Seller/brand name |
| slug | string unique | |
| rating | decimal(2,1) | 0.0 – 5.0 |
| city | string | |
| logo | string nullable | |
| banner | string nullable | |
| description | text nullable | |
| is_verified | boolean | |
| is_active | boolean | |
| created_at / updated_at | timestamps | |

### products

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| seller_id | bigint FK nullable | Null for standalone store products |
| category_id | bigint FK → categories | |
| tenant_id | bigint FK nullable | Which tenant |
| title | string | |
| description | text nullable | |
| weight | decimal(8,2) | In grams |
| wage_percentage | integer | e.g. 12 for 12% |
| tax_percentage | integer | e.g. 9 for 9% |
| metal | enum | `gold` or `silver` |
| image | string nullable | |
| is_featured | boolean | |
| is_second_hand | boolean | |
| is_custom | boolean | |
| is_active | boolean | |
| created_at / updated_at | timestamps | |

### wallets

One per user.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| user_id | bigint FK → users | |
| gold_grams | decimal(12,4) | |
| silver_grams | decimal(12,4) | |
| cash_toman | bigint | |
| created_at / updated_at | timestamps | |

### transactions

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| user_id | bigint FK → users | |
| tenant_id | bigint FK nullable | |
| type | enum | `buy_gold`, `sell_gold`, `buy_product` |
| title | string | |
| amount_toman | bigint | |
| weight_grams | decimal(10,4) nullable | |
| status | enum | `completed`, `pending`, `cancelled` |
| details | text nullable | |
| image | string nullable | |
| reference_id | string unique nullable | |
| date | timestamp | |
| created_at / updated_at | timestamps | |

### roles

Per-tenant roles with permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint PK | |
| tenant_id | bigint FK nullable | null = global role |
| name | string | |
| slug | string | Unique per tenant |
| description | text nullable | |
| is_system | boolean | |
| created_at / updated_at | timestamps | |

### permissions

Global permission slugs.

| Slug | Group | Description |
|------|-------|-------------|
| `admin.access` | admin | Access admin panel |
| `admin.roles` | admin | Manage roles |
| `admin.users` | admin | Manage users |
| `admin.tenants` | admin | Manage tenants (superadmin) |
| `transactions.view` | finance | View transactions |
| `products.manage` | products | CRUD products |
| `orders.manage` | orders | Manage orders |
| `reports.view` | reports | View reports |

### user_roles (pivot)

| Column | Type |
|--------|------|
| user_id | bigint FK |
| role_id | bigint FK |
| tenant_id | bigint FK nullable |
| created_at / updated_at | timestamps |

### role_permission (pivot)

| Column | Type |
|--------|------|
| role_id | bigint FK |
| permission_id | bigint FK |

---

## Relationships

```
User ──BelongsToMany── Tenant  (tenant_user pivot, with role)
User ──BelongsToMany── Role    (user_roles pivot)
User ──HasOne───────── Wallet
User ──HasMany──────── Transaction

Tenant ──BelongsToMany── User    (tenant_user pivot)
Tenant ──HasMany──────── Seller
Tenant ──HasMany──────── Contact
Tenant ──HasMany──────── Role

Seller ──BelongsTo────── Tenant
Seller ──HasMany──────── Product

Contact ──BelongsTo───── Tenant

Role ──BelongsToMany──── Permission (role_permission pivot)
Role ──BelongsToMany──── User (user_roles pivot)
```

---

## User Roles Within a Tenant

| tenant_user.role | Description | Admin Panel |
|------------------|-------------|-------------|
| `admin` | Full tenant admin | Yes — all features |
| `manager` | Can manage products/orders | Yes — limited |
| `staff` | Staff member | Yes — basic access |
| `seller` | غرفه‌دار (marketplace only) | Yes — manage own booth |
| `member` | Regular customer/buyer | No admin access |

---

## How Tenant Type Affects Features

| Feature | Marketplace | Store |
|---------|-------------|-------|
| Multiple sellers | ✅ | ❌ |
| Seller management in admin | ✅ (Sellers tab) | ❌ |
| Branch management in admin | ❌ | ✅ (Branches tab) |
| Seller name on products | ✅ | ❌ |
| Investment (خرید و فروش) | ✅ | ✅ |
| Services (خدمات) | ✅ | ✅ |
| Product listing | ✅ | ✅ |
| Wallet & transactions | ✅ | ✅ |
| Admin panel | ✅ | ✅ |
| Contacts | ✅ | ✅ |

---

## Seeded Demo Data

### Tenants (5)

| # | Slug | Name | Type | Domain |
|---|------|------|------|--------|
| 1 | `talana` | طلانا | marketplace | talana.ir |
| 2 | `silver-bazaar` | بازار نقره | marketplace | silver.talana.app |
| 3 | `diamond-gallery` | گالری الماس | store | diamond.talana.app |
| 4 | `pars-gold` | طلافروشی پارس | store | pars.talana.app |
| 5 | `tehran-jewelry` | جواهری تهران | store | tehran.talana.app |

### Sellers (6, inside marketplaces only)

| Seller | Marketplace | City | Rating |
|--------|-------------|------|--------|
| گالری زرین | طلانا | تهران | 4.9 |
| جواهری محمد | طلانا | اصفهان | 4.7 |
| طلای ناب | طلانا | یزد | 4.8 |
| طلا و جواهر مهر | طلانا | شیراز | 4.6 |
| گالری نقره | بازار نقره | تبریز | 4.8 |
| هنر نقره | بازار نقره | مشهد | 4.5 |

### Users (13)

| Phone | Name | Tenant | tenant_user.role |
|-------|------|--------|-----------------|
| `09123456789` | احسان مرادی | talana | admin (superadmin) |
| `09120000001` | مدیر بازار نقره | silver-bazaar | admin |
| `09120000002` | مدیر گالری الماس | diamond-gallery | admin |
| `09120000003` | مدیر طلافروشی پارس | pars-gold | admin |
| `09120000004` | مدیر جواهری تهران | tehran-jewelry | admin |
| `09121111111` | علی رضایی | talana | member |
| `09122222222` | مریم حسینی | talana | member |
| `09123333333` | حسین محمدی | talana | member |
| `09124444444` | زهرا احمدی | silver-bazaar | member |
| `09125555555` | رضا کریمی | silver-bazaar | member |
| `09126666666` | سارا موسوی | diamond-gallery | member |
| `09127777777` | امیر جعفری | pars-gold | member |
| `09128888888` | نرگس صادقی | tehran-jewelry | member |

### Contacts (8)

| Name | Phone | Type | Tenant |
|------|-------|------|--------|
| شرکت طلاسازی البرز | 02188001001 | goldsmith | talana |
| صرافی ملی | 02188002002 | money_changer | talana |
| عمده‌فروشی تهران | 02188003003 | wholesaler | talana |
| نقره‌کار تبریز | 04133001001 | goldsmith | silver-bazaar |
| بازار نقره مشهد | 05133002002 | wholesaler | silver-bazaar |
| تأمین‌کننده الماس | 02144001001 | wholesaler | diamond-gallery |
| آبشده‌فروش اصفهان | 03133001001 | melted_gold_seller | pars-gold |
| سکه‌فروش بازار | 02155001001 | coin_seller | tehran-jewelry |

---

## Auth Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| Password | `POST /api/auth/login` | Phone + password |
| OTP | `POST /api/auth/otp/request` → `POST /api/auth/otp/verify` | SMS code (dev: `111111`) |

---

## ACL Flow

1. User logs in → receives Sanctum token
2. Frontend calls `GET /api/auth/permissions` → returns `{ is_superadmin, permissions[], roles[] }`
3. Frontend stores permissions in state
4. `can('permission.slug')` gates UI elements:
   - `admin.access` → shows admin panel button
   - Admin panel pages gated by specific permissions
5. Backend routes gated by `auth:sanctum` + `permission:slug` middleware
