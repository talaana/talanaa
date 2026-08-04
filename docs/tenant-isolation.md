# Tenant Isolation — ساز و کار جداسازی فروشگاه‌ها در طلانا

## اصل مسئله

هر کاربر فقط در **فروشگاهی که در آن لاگین کرده** احراز هویت می‌شود. اگر کاربر در فروشگاه A لاگین کند، نباید به‌طور خودکار در فروشگاه B هم لاگین باشد.

## معماری — دو لایه دفاعی

### لایه ۱: فرانت‌اند — جداسازی توکن‌ها در Cookie

توکن‌ها با **کلید مجزا برای هر فروشگاه** در Cookie ذخیره می‌شوند:

```
talana_token_talana      → token for فروشگاه طلانا (slug=talana)
talana_token_store-two   → token for فروشگاه Store Two (slug=store-two)
talana_token_pars-gold   → token for طلافروشی پارس (slug=pars-gold)
```

**فایل:** `src/api.ts`

```typescript
function tokenCookieName(): string {
  return tenantSlug ? `talana_token_${tenantSlug}` : 'talana_token';
}
```

وقتی کاربر از `?tenant=talana` به `?tenant=store-two` می‌رود:
1. `TenantProvider` فروشگاه جدید را resolve می‌کند
2. `setTenantContext(id, slug)` فراخوانی می‌شود
3. کوکی `talana_token_store-two` خوانده می‌شود
4. اگر وجود نداشت → کاربر باید دوباره لاگین کند

### لایه ۲: بک‌اند — میدلور EnsureTenantAccess

هر درخواست API هدر `X-Tenant` را ارسال می‌کند. میدلور بررسی می‌کند:

**فایل:** `app/Http/Middleware/EnsureTenantAccess.php`

```
۱. کاربر لاگین کرده؟
   ↓ خیر → عبور (مسیرهای public)
   ↓ بله

۲. کاربر سوپرادمین است؟
   ↓ بله → عبور (دسترسی platform-level)
   ↓ خیر

۳. هدر X-Tenant وجود دارد؟
   ↓ خیر → عبور (legacy / platform)
   ↓ بله

۴. فروشگاه وجود دارد و فعال است؟
   ↓ خیر → 404 "فروشگاه یافت نشد"
   ↓ بله

۵. کاربر عضو این فروشگاه است؟ (جدول tenant_user)
   ↓ خیر → 403 "شما عضو این فروشگاه نیستید"
   ↓ بله

۶. عبور — درخواست پردازش می‌شود
```

## جریان کامل لاگین در یک فروشگاه

### قدم ۱: کاربر وارد فروشگاه طلانا می‌شود
```
URL: http://localhost:3000/?tenant=talana
     ↓
TenantProvider فروشگاه را resolve می‌کند:
  GET /api/tenants/resolve?slug=talana
  → tenant = { id: 1, name: "طلانا", slug: "talana", type: "marketplace" }
     ↓
setTenantContext(1, "talana")
  → authToken = from cookie "talana_token_talana" (null - first time)
     ↓
صفحه لاگین با برند طلانا نمایش داده می‌شود
```

### قدم ۲: کاربر لاگین می‌کند
```
POST /api/auth/login
Body: { phone: "09123456789", password: "***", tenant_slug: "talana" }
     ↓
AuthController@login:
  ۱. کاربر را با phone پیدا می‌کند
  ۲. رمز عبور را چک می‌کند
  ۳. ensureTenantMembership(user, "talana"):
     - فروشگاه talana را پیدا می‌کند (id=1)
     - کاربر را به tenant_user اضافه می‌کند (role=member)
  ۴. توکن Sanctum می‌سازد: $user->createToken('mobile')
     ↓
Response: {
  user: { ... },
  token: "1|abc123...",
  tenant: { id: 1, name: "طلانا", slug: "talana", type: "marketplace" }
}
     ↓
Frontend: setToken("1|abc123...")
  → Cookie: talana_token_talana = "1|abc123..."
  → authToken = "1|abc123..."
```

### قدم ۳: کاربر از API استفاده می‌کند
```
GET /api/auth/profile
Headers: Authorization: Bearer 1|abc123...
         X-Tenant: 1
     ↓
EnsureTenantAccess middleware:
  - کاربر عضو tenant 1 هست ✓
  - عبور
     ↓
Response: { user: { name: "احسان مرادی", wallet: {...} } }
```

### قدم ۴: کاربر به فروشگاه دیگر می‌رود
```
URL: http://localhost:3000/?tenant=store-two
     ↓
TenantProvider فروشگاه جدید را resolve می‌کند:
  → tenant = { id: 6, name: "Store Two", slug: "store-two" }
     ↓
setTenantContext(6, "store-two")
  → looks for cookie "talana_token_store-two"
  → NOT FOUND → authToken = null
     ↓
صفحه لاگین با برند Store Two نمایش داده می‌شود
(کاربر در طلانا لاگین بود، اما در store-two لاگین نیست)
```

### قدم ۵: اگر کسی تلاش کند تقلب کند
```
هکر توکن طلانا را برمی‌دارد و با X-Tenant: 6 امتحان می‌کند:

GET /api/auth/profile
Headers: Authorization: Bearer <talana_token>
         X-Tenant: 6
     ↓
EnsureTenantAccess middleware:
  - کاربر عضو tenant 6 نیست ✗
  → 403: "شما عضو این فروشگاه نیستید. لطفاً دوباره وارد شوید."
```

## ساختار دیتابیس

### جدول `tenant_user` (pivot)
```sql
tenant_user:
  id          | tenant_id | user_id | role   | seller_id | created_at
  ------------|-----------|---------|--------|-----------|-----------
  1           | 1 (طلانا) | 28      | member | NULL      | ...
  2           | 1 (طلانا) | 29      | member | NULL      | ...
  3           | 6 (store) | 1       | admin  | NULL      | ...
```

هر ردیف = یک عضویت. کاربر ۲۸ فقط عضو طلاناست، نه store-two.

### جدول `personal_access_tokens` (Sanctum)
```
personal_access_tokens:
  id | tokenable_type | tokenable_id | name   | token      | abilities
  ---|----------------|--------------|--------|------------|----------
  1  | App\Models\User| 28           | mobile | 1|abc123...| ["*"]
```

توکن‌ها **global** هستند — هر کاربر هر تعداد توکن می‌تواند داشته باشد.  
اما **میدلور** بررسی می‌کند که کاربر واقعاً عضو آن فروشگاه باشد.

## خلاصه

| لایه | مکانیزم | کجا |
|---|---|---|
| Frontend | Cookie per tenant slug | `src/api.ts` → `tokenCookieName()` |
| Frontend | X-Tenant header on every API call | `src/api.ts` → `apiFetch()` |
| Frontend | Tenant context switch clears stale token | `src/tenant.tsx` → `setTenantContext()` |
| Backend | Middleware checks tenant_user pivot | `EnsureTenantAccess.php` |
| Backend | Login auto-adds user to tenant | `AuthController.php` → `ensureTenantMembership()` |
| Backend | Superadmin bypasses all checks | `EnsureTenantAccess.php` |

**نتیجه:** کاربر در هر لحظه فقط در **یک فروشگاه** احراز هویت شده است.  
برای ورود به فروشگاه دیگر، باید **دوباره لاگین کند** (توکن جدید برای آن فروشگاه می‌گیرد).
