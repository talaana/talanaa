# گزارش وضعیت پروژه طلانا

**تاریخ:** ۱۲ مرداد ۱۴۰۴
**برنچ:** `main` (جلوتر از origin/main — 2 فایل untracked)
**آخرین کامیت:** `c2115f9` — `docs: production deployment guide — nginx, env, DNS, SSL, cron`

---

## وضعیت کلی

| معیار | مقدار |
|--------|-------|
| تست‌ها | **۱۲۵ تست، ۳۸۶ assertion** — ✅ همه پاس می‌شوند |
| فرانت‌اند | React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS 4 |
| بک‌اند | Laravel 13 + SQLite + Sanctum + PHP 8.3 |
| محیط اجرا | `D:\talana\` (فرانت) + `D:\talana-backend\` (بک‌اند) |

---

## فرانت‌اند (D:\talana\)

### تکنولوژی‌ها

- **Framework:** React 19.0.1
- **زبان:** TypeScript 5.8
- **Bundler:** Vite 6.2.3 (پورت 3000)
- **CSS:** Tailwind CSS 4.1.14
- **انیمیشن:** Motion (Framer Motion) 12.23
- **آیکون:** Lucide React 0.546
- **AI:** Google GenAI 2.4

### ساختار فایل‌ها

```
src/
├── admin/
│   ├── AdminPanel.tsx          # پنل مدیریت با دو مد superadmin / tenant admin
│   ├── api.ts                  # API client پنل ادمین
│   └── pages/
│       ├── Dashboard.tsx       # آمار + نمودارها
│       ├── Roles.tsx           # نقش‌ها و دسترسی‌ها
│       ├── Tenants.tsx         # مدیریت فروشگاه‌ها + impersonation
│       └── Users.tsx           # مدیریت کاربران
├── components/
│   ├── BannerSlider.tsx        # اسلایدر بنرها
│   ├── CategoryIcon.tsx        # آیکون دسته‌بندی
│   ├── Header.tsx              # هدر موبایل (دکمه ادمین برای staff)
│   ├── HomeDashboard.tsx       # داشبورد با نمودار قیمت و تراکنش سریع
│   ├── InstallerPage.tsx       # ویزارد ۳ مرحله‌ای ثبت فروشگاه جدید
│   ├── InvestmentTab.tsx       # خرید و فروش طلا/نقره
│   ├── LandingPage.tsx         # لندینگ SaaS مارکتینگ
│   ├── MarketplaceTab.tsx      # ویترین محصولات با فیلتر/جستجو
│   ├── NotificationsTab.tsx    # اعلان‌ها
│   ├── OrdersTab.tsx           # تاریخچه تراکنش‌ها
│   ├── ProductDetail.tsx       # جزئیات محصول
│   ├── ProfileTab.tsx          # پروفایل با ۹ زیرصفحه
│   ├── ServiceAutoOrder.tsx    # خرید خودکار
│   ├── ServiceDelivery.tsx     # تحویل فیزیکی
│   ├── ServiceGiftCard.tsx     # کارت هدیه
│   ├── ServiceInstallment.tsx  # اقساط
│   ├── ServiceLoan.tsx         # وام
│   ├── ServicesTab.tsx         # منوی ۵ سرویس
│   └── ServiceZargar.tsx       # سرویس زرگر
├── api.ts                      # API client اصلی (Bearer + X-Tenant + کوکی per-tenant)
├── App.tsx                     # اپ اصلی: routing، auth، ACL، tenant awareness
├── data.ts                     # داده‌های استاتیک
├── index.css                   # استایل‌های global + Tailwind
├── main.tsx                    # entry point با TenantProvider
├── tenant.tsx                  # TenantContext + تشخیص خودکار tenant از URL
├── types.ts                    # تایپ‌های TypeScript
├── utils.ts                    # توابع فارسی (toPersianDigits, formatToman, formatGram)
└── vite-env.d.ts               # تایپ Vite
```

### ویژگی‌های کلیدی

#### Multi-tenancy
- تشخیص tenant از URL با اولویت: `?tenant=slug` > `<slug>.talaana.ir` > `/s/<slug>`
- `TenantProvider` در `main.tsx` — تشخیص خودکار در mount
- هدر `X-Tenant` به صورت خودکار روی تمام API call ها
- کوکی‌های per-tenant: `talana_token_{slug}` با expiry ۳۰ روزه
- لندینگ SaaS در `/` وقتی tenant وجود ندارد
- دکمه‌های CTA لندینگ به Installer wizard متصل هستند

#### دو مد فروشگاه

| مد | Tenant type | تب‌ها | ویژگی‌ها |
|----|-------------|-------|----------|
| Marketplace | `marketplace` | خانه، ویترین، خرید و فروش، خدمات | multi-seller، seller attribution |
| Standalone Store | `store` | خانه، محصولات، خرید و فروش، خدمات | بدون seller attribution، محصولات مستقیم |

#### Panel ادمین (Hash-routed `#/admin`)
- **Superadmin:** سایدبار تیره — مدیریت تمام tenant ها، کاربران، نقش‌ها + impersonation
- **Tenant admin:** سایدبار کهربایی — marketplace admin تب sellers دارد، store admin تب branches
- **Impersonation:** superadmin با یک کلیک وارد tenant می‌شود (token ۲ ساعته)، بنر بنفش نمایش داده می‌شود، خروج token اصلی را بازیابی می‌کند
- **Responsive:** سایدبار دسکتاپ (`w-64` sticky) + drawer موبایل (`max-w-[85vw]` slide-out)

#### ACL همگام (Frontend ↔ Backend)
- `GET /api/auth/permissions` — permissions کاربر را برمی‌گرداند
- `can(perm)` helper — superadmin ها bypass می‌کنند
- UI فقط مواردی را نشان می‌دهد که کاربر دسترسی دارد
- پاک شدن permissions در logout

#### UX Patterns
- **Pages, not modals:** تمام sub-view ها صفحه کامل با header + دکمه برگشت
- **Toast:** `<motion.div>` با auto-dismiss، `fixed top-4 left-1/2 z-[200]`
- **Metal toggle:** طلا (amber) / نقره (slate) در کل app
- **Persian:** `toPersianDigits()`، `formatToman()`، `formatGram()`
- **قیمت زنده:** polling هر ۳۰ ثانیه با trend indicator (بالا/پایین/ثابت)

#### Self-Serve Installer
- ویزارد ۳ مرحله‌ای: انتخاب نوع فروشگاه → اطلاعات کسب‌وکار → حساب ادمین
- `slugify()` خودکار از نام فارسی
- بعد از ثبت: auto-login با token + صفحه celebration با لینک ورود
- پشتیبانی از `preselectedType` prop از لندینگ

---

## بک‌اند (D:\talana-backend\)

### تکنولوژی‌ها

- **Framework:** Laravel 13
- **PHP:** 8.3
- **Auth:** Sanctum (token-based)
- **Database:** SQLite (dev) / MySQL (production planned)
- **Testing:** PHPUnit 12.5

### مدل‌ها (۱۷ مدل)

| مدل | فیلدهای کلیدی | روابط |
|-----|--------------|-------|
| **User** | name, phone, password, otp_code, otp_expires_at, national_code | wallet, transactions, tenants (M:N via tenant_user), roles |
| **Tenant** | name, slug, type (marketplace/store), domain, logo, settings, is_active | users (deprecated), tenantUsers (M:N), sellers, contacts, wallet (morphOne) |
| **Seller** | name, slug, rating, city, logo, banner, tenant_id | products, tenant |
| **Product** | seller_id (nullable), category_id, title, weight, wage/tax %, metal, image | seller (withDefault), category |
| **Contact** | tenant_id, name, phone, type (enum 6 type), notes, is_active | tenant, wallet (morphOne) |
| **Wallet** | walletable_type, walletable_id, user_id, gold_grams, silver_grams, cash_toman | walletable (morphTo), user, walletTransactions |
| **WalletTransaction** | wallet_id, type, amount, metal, weight_grams, cash_amount, reference, notes | wallet |
| **Transaction** | user_id, type, title, amount_toman, weight_grams, metal, status | user |
| **GoldPrice** | metal, price_per_gram, recorded_at | — |
| **PosTransaction** | tenant_id, user_id, contact_id, type, weight_grams, price_per_gram, metal, payment_method | tenant, user, contact |
| **Quotation** | tenant_id, user_id, contact_id, type, metal, weight_grams, status, pos_transaction_id, auto_trade_enabled | tenant, user, contact, posTransaction |
| **Invoice** | tenant_id, user_id, contact_id, invoice_number, type, status, items (json) | tenant, user, contact |
| **Bill** | tenant_id, user_id, title, amount, status | tenant, user |
| **AccountingEntry** | tenant_id, pos_transaction_id, type, amount, description | tenant, posTransaction |
| **Role** | name, slug, description, tenant_id, seller_id (nullable), is_system | permissions, users |
| **Permission** | name, slug, group | roles |
| + **Category, Banner, Notification, Branch, BankAccount, Loan, InstallmentPlan, AutoOrder, DeliveryRequest, GiftCard** | | |

### API Endpoints

#### Public (بدون احراز)
```
POST   /api/auth/register          # ثبت‌نام با phone + password
POST   /api/auth/login             # ورود با phone + password
POST   /api/auth/otp/request       # درخواست کد OTP (auto-register)
POST   /api/auth/otp/verify        # تأیید کد OTP
POST   /api/tenants/register       # ثبت فروشگاه جدید (self-serve)
GET    /api/tenants/resolve        # تشخیص tenant با slug/domain/host
GET    /api/tenants/directory      # لیست tenant های عمومی
GET    /api/prices/current         # قیمت فعلی طلا و نقره
GET    /api/prices/history         # تاریخچه قیمت
GET    /api/categories             # دسته‌بندی محصولات
GET    /api/products               # لیست محصولات (با فیلتر)
GET    /api/products/{product}     # جزئیات محصول
GET    /api/sellers                # لیست فروشنده‌ها
GET    /api/sellers/{seller}       # جزئیات فروشنده
GET    /api/banners                # بنرها
GET    /api/branches               # شعب
```

#### Authenticated (auth:sanctum)
```
GET    /api/auth/profile           # پروفایل کاربر
PUT    /api/auth/profile           # ویرایش پروفایل
PUT    /api/auth/password          # تغییر رمز
POST   /api/auth/logout            # خروج
GET    /api/auth/permissions       # ACL sync — permissions کاربر
GET    /api/wallet                 # کیف پول کاربر
GET    /api/transactions           # تراکنش‌ها
POST   /api/transactions           # ایجاد تراکنش
GET    /api/notifications          # اعلان‌ها
PUT    /api/notifications/{id}/read
PUT    /api/notifications/read-all
GET    /api/bank-accounts          # حساب‌های بانکی
POST   /api/bank-accounts
DELETE /api/bank-accounts/{id}
POST   /api/loans/calculate        # محاسبه وام
POST   /api/loans                  # درخواست وام
GET    /api/loans
POST   /api/installments/calculate # محاسبه اقساط
POST   /api/installments           # درخواست اقساط
GET    /api/installments
POST   /api/auto-orders            # خرید خودکار
GET    /api/auto-orders
PUT    /api/auto-orders/{id}/toggle
DELETE /api/auto-orders/{id}
POST   /api/deliveries             # درخواست تحویل
GET    /api/deliveries
POST   /api/gift-cards             # کارت هدیه
GET    /api/gift-cards
```

#### Admin (auth:sanctum + permission:admin.access)
```
# Dashboard
GET    /api/admin/dashboard/stats
GET    /api/admin/dashboard/permissions

# Roles & Permissions
GET    /api/admin/roles
POST   /api/admin/roles
PUT    /api/admin/roles/{id}
DELETE /api/admin/roles/{id}
GET    /api/admin/permissions

# Users
GET    /api/admin/users
PUT    /api/admin/users/{id}

# Tenants
GET    /api/admin/tenants
POST   /api/admin/tenants
GET    /api/admin/tenants/{id}
PUT    /api/admin/tenants/{id}
PUT    /api/admin/tenants/{id}/toggle        # فعال/غیرفعال
POST   /api/admin/tenants/{id}/impersonate   # ورود به عنوان tenant

# Products
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/{id}
PUT    /api/admin/products/{id}
DELETE /api/admin/products/{id}
GET    /api/admin/pricing/calculate           # محاسبه قیمت طلا
GET    /api/admin/pricing/tablo              # تابلو قیمت‌ها

# Contacts
GET    /api/admin/contacts
POST   /api/admin/contacts
GET    /api/admin/contacts/{id}
PUT    /api/admin/contacts/{id}
DELETE /api/admin/contacts/{id}

# Orders
GET    /api/admin/orders

# POS (Point of Sale)
GET    /api/admin/pos
POST   /api/admin/pos                         # buy/sell gold & silver

# Accounting
GET    /api/admin/accounting
GET    /api/admin/accounting/balance

# Invoices
GET    /api/admin/invoices
POST   /api/admin/invoices
POST   /api/admin/invoices/{id}/pay

# Bills
GET    /api/admin/bills
POST   /api/admin/bills/{id}/pay

# Reports
GET    /api/admin/reports/summary

# Wallet Admin
GET    /api/admin/wallet/{user}
POST   /api/admin/wallet/{user}/deposit
POST   /api/admin/wallet/{user}/withdraw

# Tenant Wallet
GET    /api/admin/tenant-wallet
POST   /api/admin/tenant-wallet/deposit

# Quotations (پیش‌فاکتور)
GET    /api/admin/quotations
POST   /api/admin/quotations
POST   /api/admin/quotations/{id}/send       # draft → sent
POST   /api/admin/quotations/{id}/accept     # → executed + auto-trade
POST   /api/admin/quotations/{id}/reject     # → rejected
GET    /api/admin/quotations/pending         # لیست pending برای auto-trading
```

### Database (۳۲ Migration)

**جداول پایه:** users, cache, jobs, personal_access_tokens

**جداول اصلی کسب‌وکار:**
- `tenants` — با type enum (`marketplace`, `store`)
- `tenant_user` — pivot با role + seller_id
- `sellers` — فروشنده‌های marketplace
- `categories` — ۹ دسته‌بندی
- `products` — با seller_id nullable
- `contacts` — ۶ نوع مخاطب تجاری
- `wallets` — polymorphic (walletable)
- `wallet_transactions` — تاریخچه کیف پول
- `transactions` — تراکنش‌های کاربران
- `gold_prices` — قیمت طلا/نقره
- `pos_transactions` — تراکنش‌های فروشگاهی
- `accounting_entries` — ثبت‌های حسابداری
- `invoices` — فاکتورها
- `bills` — قبوض
- `quotations` — پیش‌فاکتورها با auto_trade_enabled
- `notifications`, `banners`, `bank_accounts`, `branches`
- `loans`, `installment_plans`, `auto_orders`, `delivery_requests`, `gift_cards`

### Seeder Data

| آیتم | تعداد | توضیح |
|------|-------|-------|
| **Tenant ها** | ۵ | ۲ marketplace + ۳ standalone store |
| | | طلانا (marketplace, talana) |
| | | بازار نقره (marketplace, silver-bazaar) |
| | | گالری الماس (store, diamond-gallery) |
| | | پارس گلد (store, pars-gold) |
| | | تهران جواهر (store, tehran-jewelry) |
| **Seller ها** | ۶ | داخل marketplace طلانا: زرین، محمد، ناب، مهر و... |
| **Staff ها** | ۲۸ | در tenant_user با نقش‌های admin, manager, staff, seller, seller_staff |
| **Contact ها** | ۱۵ | در ۶ نوع: customer, wholesaler, melted_gold_seller, goldsmith, coin_seller, money_changer |
| **Category ها** | ۹ | انگشتر، گردنبند، دستبند، گوشواره، سرویس، شمش، سکه، طلای دست‌دوم، سفارشی‌سازی |
| **Permission ها** | ۸ | admin.access, admin.roles, admin.users, admin.tenants, transactions.view, products.manage, orders.manage, reports.view |
| **Tenant Wallet ها** | هر tenant | ۵۰g طلا + ۵۰۰g نقره + ۵۰۰M تومان |

### نقش‌ها و دسترسی‌ها

| نقش | Permissions | seller_id | محل استفاده |
|------|------------|-----------|-------------|
| **superadmin** | همه permissions | null | سیستم (global) |
| **admin** | admin.access, admin.users, transactions.view, products.manage, orders.manage, reports.view | null | همه tenant ها |
| **manager** | admin.access, transactions.view, products.manage, orders.manage, reports.view | null | همه tenant ها |
| **staff** | admin.access, transactions.view, orders.manage | null | همه tenant ها |
| **seller** (غرفه‌دار) | admin.access, products.manage, orders.manage | seller.id | marketplace only |
| **seller_staff** | admin.access, transactions.view, orders.manage | seller.id | marketplace only |

---

## معماری‌های کلیدی

### Polymorphic Wallet System

سه entity می‌توانند کیف پول داشته باشند:
- **User** — کارمندان و staff
- **Tenant** — موجودی فروشگاه (خرید/فروش از کیف پول فروشگاه)
- **Contact** — آینده: مشتریان می‌توانند اعتبار داشته باشند

`Wallet::for($entity)` — پیدا کردن یا ایجاد کیف پول برای هر entity

### Quotation System (پیش‌فاکتور → Auto-Trade)

```
1. Staff ایجاد پیش‌فاکتور → POST /quotations (draft)
2. Staff ارسال به مخاطب → POST /quotations/{id}/send (sent)
3. مخاطب قبول می‌کند → POST /quotations/{id}/accept (executed)
   ├── Auto-create PosTransaction
   ├── Auto-update Tenant Wallet (برداشت/واریز)
   ├── Create AccountingEntry
   └── Create WalletTransaction
4. یا مخاطب رد می‌کند → POST /quotations/{id}/reject (rejected)
```

آینده: فیلدهای `auto_trade_enabled` و `auto_trade_algorithm` برای موتور AI/algorithmic trading

### Tenant Detection Flow

```
1. URL query param:    ?tenant=talana         (dev mode)
2. Subdomain:          talana.talaana.ir      (production)
3. Path prefix:        /s/talana              (legacy)
4. No tenant detected  → LandingPage (SaaS marketing)
```

### ACL Synchronization Pattern

```
Frontend:
  1. بعد از login → GET /api/auth/permissions
  2. setUserPerms(data.permissions) + setIsSuperadmin(data.is_superadmin)
  3. can(perm) = isSuperadmin || userPerms.includes(perm)
  4. UI gate: {can('admin.access') && <AdminButton />}
  5. logout → reset perms

Backend:
  - GET /api/auth/permissions (auth:sanctum, بدون admin middleware)
  - GET /api/admin/dashboard/permissions (admin group)
  - permission:admin.access middleware روی همه admin routes
```

---

## تست‌ها

**وضعیت:** ✅ ۱۲۵ تست، ۳۸۶ assertion — همه پاس

| # | فایل تست | تعداد تست | حوزه |
|---|---------|----------|------|
| ۱ | **BackOfficeFlowTest** | ۲۲ | POS buy/sell (cash + wallet)، accounting entries، invoice create/pay، bill pay، report summary، full integration flow، wallet deposit/withdraw، quotation full lifecycle |
| ۲ | **StandaloneStoreJourneyTest** | ۲۵ | Admin CRUD، impersonation، service endpoints، inactive store isolation |
| ۳ | **MarketplaceVsStoreArchitectureTest** | ۱۹ | Sellers belong to marketplace not stores، tenant type in admin responses، impersonation includes type |
| ۴ | **AdminPanelFeaturesTest** | ۱۶ | Gold pricing formula، products CRUD، contacts CRUD by type، orders list، dashboard stats، contact margin calculation |
| ۵ | **AuthAndTenantTest** | ۱۳ | Registration، login، profile، password، tenant resolution، admin CRUD |
| ۶ | **MarketplaceBuyerJourneyTest** | ۱۲ | Browse، filter، search، transactions، logout |
| ۷ | **StaffRolesAndContactsTest** | ۱۱ | Staff permissions، seller_staff via seller_id، contacts no user accounts، 6 contact types، seeded counts |
| ۸ | **OtpLoginTest** | ۷ | OTP request new/existing users، verify correct/wrong code، full OTP flow، coexistence with password login |

### اجرای تست‌ها

```bash
cd D:\talana-backend
php artisan test --compact          # همه تست‌ها
php artisan test --filter=ClassName # فیلتر
```

---

## Production Deployment

مستندات کامل در `docs/production-deployment.md` شامل:

- **Domain:** `talaana.ir` با wildcard SSL (`*.talaana.ir`)
- **API:** `api.talaana.ir`
- **Frontend:** `talaana.ir` (static dist)
- **Tenant subdomains:** `{slug}.talaana.ir`
- **SESSION_DOMAIN:** `.talaana.ir` (cross-subdomain auth)
- **Nginx:** wildcard server_name، reverse proxy API، static frontend
- **CORS:** wildcard subdomain support
- **Cron jobs:** برای price polling و auto-trading
- **Database migration:** SQLite → MySQL برای production

---

## نکات فنی (Pitfalls)

### Windows / Git Bash
- دستورات PHP/Composer نیاز به wrapper: `cmd /c "..."` 
- Port conflicts: `netstat -ano | grep ':PORT'` + `cmd /c "taskkill /F /PID <PID>"`
- composer dump-autoload: `--no-scripts` flag جلوگیری از hang

### Code
- مدل‌های با `#[Fillable]` attribute: حتماً هم attribute و هم `casts()` آپدیت شوند
- API از snake_case استفاده می‌کند، frontend با camelCase کار می‌کند
- SQLite امکان `ALTER TABLE ... CHANGE COLUMN` ندارد — از raw SQL استفاده شود
- مقدار wallet در API integer است — assert با `0` نه `0.0`
- تست‌های PHPUnit 12: متدها باید prefix `test` داشته باشند (نه `/** @test */`)
- Phone numbers در seeder: بدون leading zero (پارسر octal)

---

## فایل‌های مستندات موجود

```
D:\talana\
├── ADMIN_FEATURES.md          # Gold pricing formula، admin APIs
├── BACKOFFICE.md              # POS، Accounting، Invoices، Bills، Reports
├── DATA_MODEL.md              # Full database schema + relationships
├── DEMO_DATA.md               # Seeded data v1
├── DEMO_DATA_V2.md            # Seeded data v2
├── DEMO_DATA_V3.md            # Seeded data v3 (current)
├── LOCAL_DEV_GUIDE.md         # Local development setup
├── RUN_LOCALLY.md             # How to run both projects
├── README.md
└── docs/
    ├── production-deployment.md  # Nginx, DNS, SSL, env configs
    └── project-status-report.md  # این فایل
```
