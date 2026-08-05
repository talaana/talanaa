# Auth Context — ساز و کار احراز هویت و ذخیره‌سازی نقش و دسترسی

## Login response shape

Every login/register/OTP-verify endpoint returns the same payload:

```json
{
  "user": {
    "id": 28,
    "name": "احسان مرادی",
    "phone": "09123456789",
    "verification_status": "verified",
    "fingerprint_enabled": false,
    "referral_code": "TLNA001",
    "wallet": {
      "gold_grams": 2.458,
      "silver_grams": 42.5,
      "cash_toman": 8450000
    }
  },
  "token": "19|SAJ8KFy1RTp3NlwntxB7TztD6LJBMOUaxrD74egsb2b7b76b",
  "type": "user",
  "is_superadmin": true,
  "tenant": {
    "id": 1,
    "name": "طلانا",
    "slug": "talana",
    "type": "marketplace"
  },
  "role": "admin",
  "permissions": [
    "admin.access",
    "admin.roles",
    "admin.users",
    "admin.tenants",
    "transactions.view",
    "products.manage",
    "orders.manage",
    "reports.view"
  ],
  "roles": ["superadmin"]
}
```

| Field | Source | Description |
|---|---|---|
| `type` | hardcoded `"user"` | Always `"user"` — contacts cannot log in |
| `is_superadmin` | `User::isSuperAdmin()` | Platform-level superadmin flag |
| `role` | `tenant_user` pivot | The user's role IN THIS TENANT (`admin`, `manager`, `staff`, `seller`, `member`) |
| `permissions` | tenant-scoped RBAC | Permission slugs the user has in this tenant |
| `roles` | `user_roles` pivot | Role slugs in this tenant (Spatie-like RBAC) |

## How permissions are scoped per tenant

**File:** `app/Models/User.php`

```php
// Superadmin → all permissions from all roles (platform-wide)
public function getAllPermissions(): array { ... }

// Regular user → only permissions from roles in THIS tenant
public function getTenantPermissions(Tenant $tenant): array
{
    return $this->roles()
        ->wherePivot('tenant_id', $tenant->id)  // filter by tenant
        ->with('permissions')
        ->get()
        ->pluck('permissions.*.slug')
        ->flatten()->unique()->values()->toArray();
}

// Role slug from tenant_user pivot (admin/manager/staff/seller/member)
public function getTenantRole(Tenant $tenant): ?string
{
    $membership = $this->tenants()->where('tenant_id', $tenant->id)->first();
    return $membership?->pivot?->role;
}
```

## Frontend: auth context in cookies

**File:** `src/api.ts`

Auth context is cached in a cookie keyed by tenant slug, so switching tenants automatically loads the right context:

```
talana_auth_talana      → { type, role, permissions, is_superadmin, roles }
talana_auth_store-two   → { type, role, permissions, is_superadmin, roles }
```

```typescript
// After successful login, store in cookie immediately (no extra API call)
export const auth = {
  login: async (phone, password, tenantSlug) => {
    const data = await apiFetch('/auth/login', { ... });
    setToken(data.token);
    setAuthContext({
      type: data.type,
      role: data.role,
      permissions: data.permissions,
      is_superadmin: data.is_superadmin,
      roles: data.roles,
    });
    return data;
  },
  // same for register() and verifyOtp()
};
```

## Auth state flow

### First visit (no cookie)

```
1. User visits ?tenant=talana
2. TenantProvider resolves → tenant = { id: 1, slug: "talana" }
3. setTenantContext(1, "talana")
   → looks for cookie talana_token_talana → not found → authToken = null
   → looks for cookie talana_auth_talana → not found → authContext = null
4. isLoggedIn = false → shows login page
```

### Login

```
1. User submits login form
2. POST /api/auth/login { phone, password, tenant_slug: "talana" }
3. Server responds with: { user, token, type, role, permissions, is_superadmin, roles, tenant }
4. setToken(data.token)
   → cookie: talana_token_talana = "19|abc..."
5. setAuthContext({ type: "user", role: "member", permissions: [], ... })
   → cookie: talana_auth_talana = JSON
6. getAuthContext() returns the context synchronously
7. UI updates: setUserPerms(), setIsSuperadmin() — instant, no API call
```

### Return visit (has cookie)

```
1. User visits ?tenant=talana
2. TenantProvider resolves → tenant = { id: 1, slug: "talana" }
3. setTenantContext(1, "talana")
   → cookie talana_token_talana found → authToken = "19|abc..."
   → cookie talana_auth_talana found → authContext = { role: "member", permissions: [], ... }
4. isLoggedIn = true, isLoading = true
5. getAuthContext() restores perms synchronously (instant)
6. loadUserData() calls /api/auth/profile (server refresh)
7. isLoading = false → shows dashboard
```

### Switch to different tenant (no cookie there)

```
1. User clicks "Store Two" → ?tenant=store-two
2. TenantProvider resolves → tenant = { id: 6, slug: "store-two" }
3. setTenantContext(6, "store-two")
   → cookie talana_token_store-two → not found → authToken = null
   → cookie talana_auth_store-two → not found → authContext = null
4. isLoggedIn = false → shows login page for Store Two
   (user is NOT authenticated in Store Two — must log in separately)
```

## Middleware: backend enforcement

**File:** `app/Http/Middleware/EnsureTenantAccess.php`

The middleware is the backend guard. It attaches `tenant` and `tenant_role` to the request for downstream controllers:

```php
$request->attributes->set('tenant', $tenant);
$request->attributes->set('tenant_role', $membership->pivot->role);
```

Any controller can access the current tenant context:

```php
$tenant = $request->attributes->get('tenant');
$role = $request->attributes->get('tenant_role');
```

## Cookies summary

| Cookie | Key | Content | Lifetime |
|---|---|---|---|
| Token | `talana_token_{slug}` | Sanctum plainTextToken | 30 days |
| Auth context | `talana_auth_{slug}` | JSON: `{ type, role, permissions, is_superadmin, roles }` | 30 days |
| Show balances | `talana_show_balances` | `"true"` / `"false"` | sessionStorage |

All cookies are per-tenant — switching tenants loads the correct set automatically.
