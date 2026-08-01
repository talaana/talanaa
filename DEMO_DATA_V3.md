# Talana — Demo Data & Architecture (v3)

All accounts: password = `password` | OTP = `111111`

---

## Core Architecture

```
┌─────────────────────────────────────────────┐
│  USERS = STAFF ONLY                         │
│  (people who log into the admin panel)      │
│                                             │
│  Roles: admin, manager, staff,              │
│         seller, seller_staff                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  CONTACTS = 6 TYPES                         │
│  (business contacts, NO login, NO user acct)│
│                                             │
│  Types: customer, wholesaler,               │
│         melted_gold_seller, goldsmith,       │
│         coin_seller, money_changer          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  SELLER STAFF (marketplace only)            │
│  Booth-level staff linked via seller_id     │
│  in tenant_user pivot                       │
└─────────────────────────────────────────────┘
```

---

## Staff Roles & Permissions

### admin — ادمین
Full tenant control. Created automatically when a tenant is registered.

| Permission | Description |
|-----------|-------------|
| `admin.access` | Access admin panel |
| `admin.users` | Manage tenant users |
| `transactions.view` | View all transactions |
| `products.manage` | CRUD products |
| `orders.manage` | Manage orders |
| `reports.view` | View reports |

**Admin panel tabs:** Dashboard, Orders, Products, Sellers (marketplace) / Branches (store), Users

---

### manager — مدیر
Day-to-day operations manager. Can manage products and orders but cannot manage users or roles.

| Permission | Description |
|-----------|-------------|
| `admin.access` | Access admin panel |
| `transactions.view` | View transactions |
| `products.manage` | CRUD products |
| `orders.manage` | Manage orders |
| `reports.view` | View reports |

**Admin panel tabs:** Dashboard, Orders, Products, Reports
**Cannot:** Manage users, manage roles, create/delete tenants

---

### staff — کارمند
Basic staff member. Handles orders and views transactions. Cannot manage products.

| Permission | Description |
|-----------|-------------|
| `admin.access` | Access admin panel |
| `transactions.view` | View transactions |
| `orders.manage` | Manage orders |

**Admin panel tabs:** Dashboard, Orders
**Cannot:** Manage products, view reports, manage users

---

### seller — غرفه‌دار (marketplace only)
Booth owner inside a marketplace. Manages their own products and orders.

| Permission | Description |
|-----------|-------------|
| `admin.access` | Access admin panel |
| `products.manage` | CRUD own products |
| `orders.manage` | Manage own orders |

**Admin panel tabs:** Dashboard, My Products, My Orders
**Cannot:** View other sellers' data, manage users, view reports
**Linked to:** Specific seller (booth) via `tenant_user.seller_id`

---

### seller_staff — کارمند غرفه (marketplace only)
Staff working for a specific booth inside a marketplace. Handles orders for that booth.

| Permission | Description |
|-----------|-------------|
| `admin.access` | Access admin panel |
| `transactions.view` | View transactions |
| `orders.manage` | Manage own booth orders |

**Admin panel tabs:** Dashboard, Orders
**Cannot:** Manage products, view reports
**Linked to:** Specific seller (booth) via `tenant_user.seller_id`

---

### superadmin — سوپر ادمین
Platform-wide control. Manages all tenants, users, and roles.

| Permission | Description |
|-----------|-------------|
| All permissions | Full platform access |
| `admin.tenants` | Create/manage tenants |
| `admin.roles` | Create/manage roles |

**Admin panel:** Dark sidebar, all features across all tenants

---

## Contact Types (6 types, NO user accounts)

Contacts are managed by staff through the admin panel. They do NOT log in.

### customer — مشتری
End buyer/customer. Purchases products from the store or marketplace.
- No admin panel
- No login
- Managed in contacts list by staff

### wholesaler — بنکدار و کیفی
Bulk gold/silver supplier. Provides raw materials or wholesale products.
- Contact info stored in CRM
- Can be linked to transactions
- Staff manage wholesale relationships

### melted_gold_seller — آبشده فروش
Supplier of melted gold (طلای آب‌شده). Key partner for gold trading.
- Critical for marketplace inventory
- Price negotiations tracked in notes
- Contact type visible in supply chain views

### goldsmith — طلاساز
Jewelry maker/craftsperson. Creates custom pieces or repairs.
- Can be assigned to custom orders
- Workshop details stored in notes
- Quality ratings tracked

### coin_seller — سکه فروش
Coin dealer. Supplies gold/silver coins.
- Coin inventory tracked
- Market rates negotiated
- Authentication certificates stored

### money_changer — صراف
Currency and gold exchanger. Handles cash/gold conversions.
- Exchange rates tracked
- Transaction history linked
- Compliance documents stored

---

## Demo Data

### طلانا (Marketplace) — `/?tenant=talana`

**Staff (tenant-level):**
| Phone | Name | Role | Key Permissions |
|-------|------|------|----------------|
| `09130000001` | ادمین طلانا | admin | All tenant permissions |
| `09130000002` | مدیر طلانا | manager | products, orders, reports |
| `09130000003` | کارمند طلانا | staff | orders only |

**Superadmin:**
| Phone | Name | Role |
|-------|------|------|
| `09123456789` | احسان مرادی | superadmin |

**Sellers (غرفه‌ها) + their staff:**
| Seller | Seller Owner (غرفه‌دار) | Seller Staff (کارمند غرفه) |
|--------|----------------------|--------------------------|
| گالری زرین | `09130000004` | `09130000005` |
| جواهری محمد | `09130000006` | `09130000007` |
| طلای ناب | `09130000008` | `09130000009` |
| طلا و جواهر مهر | `09130000010` | `09130000011` |

**Contacts:**
| Name | Phone | Type |
|------|-------|------|
| شرکت طلاسازی البرز | 02188001001 | goldsmith |
| صرافی ملی | 02188002002 | money_changer |
| عمده‌فروشی تهران | 02188003003 | wholesaler |
| آبشده‌فروش مرکزی | 02188004004 | melted_gold_seller |
| سکه‌فروش بازار بزرگ | 02188005005 | coin_seller |
| مشتری VIP طلانا | 09128001001 | customer |

---

### بازار نقره (Marketplace) — `/?tenant=silver-bazaar`

**Staff:**
| Phone | Name | Role |
|-------|------|------|
| `09130000012` | ادمین بازار نقره | admin |
| `09130000013` | مدیر بازار نقره | manager |
| `09130000014` | کارمند بازار نقره | staff |

**Seller staff:**
| Seller | Owner | Staff |
|--------|-------|-------|
| گالری نقره | `09130000015` | `09130000016` |
| هنر نقره | `09130000017` | `09130000018` |

**Contacts:**
| Name | Phone | Type |
|------|-------|------|
| نقره‌کار تبریز | 04133001001 | goldsmith |
| بازار نقره مشهد | 05133002002 | wholesaler |
| مشتری نقره | 09128002001 | customer |

---

### گالری الماس (Store) — `/?tenant=diamond-gallery`

**Staff:**
| Phone | Name | Role |
|-------|------|------|
| `09130000019` | ادمین گالری الماس | admin |
| `09130000020` | مدیر گالری الماس | manager |
| `09130000021` | کارمند گالری الماس | staff |

**Contacts:**
| Name | Phone | Type |
|------|-------|------|
| تأمین‌کننده الماس | 02144001001 | wholesaler |
| مشتری الماس | 09128003001 | customer |

---

### طلافروشی پارس (Store) — `/?tenant=pars-gold`

**Staff:**
| Phone | Name | Role |
|-------|------|------|
| `09130000022` | ادمین طلافروشی پارس | admin |
| `09130000023` | مدیر طلافروشی پارس | manager |
| `09130000024` | کارمند طلافروشی پارس | staff |

**Contacts:**
| Name | Phone | Type |
|------|-------|------|
| آبشده‌فروش اصفهان | 03133001001 | melted_gold_seller |
| صراف پارس | 09128004001 | money_changer |

---

### جواهری تهران (Store) — `/?tenant=tehran-jewelry`

**Staff:**
| Phone | Name | Role |
|-------|------|------|
| `09130000025` | ادمین جواهری تهران | admin |
| `09130000026` | مدیر جواهری تهران | manager |
| `09130000027` | کارمند جواهری تهران | staff |

**Contacts:**
| Name | Phone | Type |
|------|-------|------|
| سکه‌فروش بازار تهران | 02155001001 | coin_seller |
| طلاساز تهران | 09128005001 | goldsmith |

---

## tenant_user Pivot Structure

```sql
tenant_user
├── tenant_id   FK → tenants
├── user_id     FK → users
├── role        admin | manager | staff | seller | seller_staff
├── seller_id   FK → sellers (nullable — only for seller/seller_staff)
└── timestamps
```

**Unique:** `(tenant_id, user_id)`

---

## Test Coverage

| Test File | Tests | Focus |
|-----------|-------|-------|
| AuthAndTenantTest | 13 | Auth flow, tenant resolution |
| MarketplaceBuyerJourneyTest | 12 | Buyer lifecycle |
| StandaloneStoreJourneyTest | 25 | Store admin, impersonation, services |
| MarketplaceVsStoreArchitectureTest | 19 | Architecture distinction |
| OtpLoginTest | 7 | OTP login flow |
| StaffRolesAndContactsTest | 11 | Staff permissions, contacts, seller staff |
| **Total** | **87** | **240 assertions** |
