# Talana — Demo Data Reference (v2)

All accounts: password = `password` | OTP = `111111`

---

## Tenants & Their Users

### 1. طلانا (Marketplace) — `/?tenant=talana`

| Phone | Name | Role | Permissions |
|-------|------|------|-------------|
| `09123456789` | احسان مرادی | superadmin | All (platform-wide) |
| `09130000001` | مدیر طلانا | manager | admin.access, transactions.view, products.manage, orders.manage, reports.view |
| `09130000002` | کارمند طلانا | staff | admin.access, transactions.view, orders.manage |
| `09130000003` | غرفه‌دار طلانا | seller | admin.access, products.manage, orders.manage |

**Demo Customers (مشتری):**
| Phone | Name | Wallet |
|-------|------|--------|
| `09121111111` | علی رضایی | 1.5g gold / 20g silver / 5M Toman |
| `09122222222` | مریم حسینی | 3.2g gold / 35g silver / 12M Toman |
| `09123333333` | حسین محمدی | 0.8g gold / 10g silver / 3M Toman |

**Contact Users (all 6 types):**
| Phone | Name | Contact Type |
|-------|------|-------------|
| `09135000001` | مشتری نمونه طلانا | customer |
| `09135000002` | بنکدار طلای تهران | wholesaler |
| `09135000003` | آبشده‌فروش مرکزی | melted_gold_seller |
| `09135000004` | طلاساز البرز | goldsmith |
| `09135000005` | سکه‌فروش بازار بزرگ | coin_seller |
| `09135000006` | صراف ارز طلا | money_changer |

**Sellers (غرفه‌ها):** گالری زرین, جواهری محمد, طلای ناب, طلا و جواهر مهر

---

### 2. بازار نقره (Marketplace) — `/?tenant=silver-bazaar`

| Phone | Name | Role | Permissions |
|-------|------|------|-------------|
| `09120000001` | مدیر بازار نقره | admin | Full tenant admin |
| `09130000011` | مدیر بازار نقره | manager | admin.access, transactions.view, products.manage, orders.manage, reports.view |
| `09130000012` | کارمند بازار نقره | staff | admin.access, transactions.view, orders.manage |
| `09130000013` | غرفه‌دار بازار نقره | seller | admin.access, products.manage, orders.manage |

**Demo Customers:**
| Phone | Name | Wallet |
|-------|------|--------|
| `09124444444` | زهرا احمدی | 0g gold / 80g silver / 8M Toman |
| `09125555555` | رضا کریمی | 0.5g gold / 120g silver / 15M Toman |

**Contact Users:**
| Phone | Name | Type |
|-------|------|------|
| `09135000011` | مشتری بازار نقره | customer |
| `09135000012` | طلاساز نقره تبریز | goldsmith |
| `09135000013` | بنکدار نقره مشهد | wholesaler |

**Sellers:** گالری نقره, هنر نقره

---

### 3. گالری الماس (Store) — `/?tenant=diamond-gallery`

| Phone | Name | Role | Permissions |
|-------|------|------|-------------|
| `09120000002` | مدیر گالری الماس | admin | Full tenant admin |
| `09130000021` | مدیر گالری الماس | manager | admin.access, transactions.view, products.manage, orders.manage, reports.view |
| `09130000022` | کارمند گالری الماس | staff | admin.access, transactions.view, orders.manage |

**Demo Customers:**
| Phone | Name | Wallet |
|-------|------|--------|
| `09126666666` | سارا موسوی | 2.0g gold / 0g silver / 20M Toman |

**Contact Users:**
| Phone | Name | Type |
|-------|------|------|
| `09135000021` | مشتری الماس | customer |
| `09135000022` | بنکدار الماس | wholesaler |

---

### 4. طلافروشی پارس (Store) — `/?tenant=pars-gold`

| Phone | Name | Role | Permissions |
|-------|------|------|-------------|
| `09120000003` | مدیر طلافروشی پارس | admin | Full tenant admin |
| `09130000031` | مدیر طلافروشی پارس | manager | admin.access, transactions.view, products.manage, orders.manage, reports.view |
| `09130000032` | کارمند طلافروشی پارس | staff | admin.access, transactions.view, orders.manage |

**Demo Customers:**
| Phone | Name | Wallet |
|-------|------|--------|
| `09127777777` | امیر جعفری | 4.5g gold / 15g silver / 25M Toman |

**Contact Users:**
| Phone | Name | Type |
|-------|------|------|
| `09135000031` | مشتری طلافروشی پارس | customer |
| `09135000032` | آبشده‌فروش اصفهان | melted_gold_seller |

---

### 5. جواهری تهران (Store) — `/?tenant=tehran-jewelry`

| Phone | Name | Role | Permissions |
|-------|------|------|-------------|
| `09120000004` | مدیر جواهری تهران | admin | Full tenant admin |
| `09130000041` | مدیر جواهری تهران | manager | admin.access, transactions.view, products.manage, orders.manage, reports.view |
| `09130000042` | کارمند جواهری تهران | staff | admin.access, transactions.view, orders.manage |

**Demo Customers:**
| Phone | Name | Wallet |
|-------|------|--------|
| `09128888888` | نرگس صادقی | 1.2g gold / 25g silver / 7M Toman |

**Contact Users:**
| Phone | Name | Type |
|-------|------|------|
| `09135000041` | مشتری جواهری تهران | customer |
| `09135000042` | سکه‌فروش بازار تهران | coin_seller |

---

## Roles & Permissions Summary

| Role | Permissions | Has Admin Panel |
|------|------------|----------------|
| **superadmin** | All (platform-wide) | ✅ Full access |
| **admin** | admin.access, users, transactions.view, products.manage, orders.manage, reports.view | ✅ Full tenant |
| **manager** | admin.access, transactions.view, products.manage, orders.manage, reports.view | ✅ Most features |
| **staff** | admin.access, transactions.view, orders.manage | ✅ Limited |
| **seller** (marketplace only) | admin.access, products.manage, orders.manage | ✅ Booth management |
| **member** (customer) | None | ❌ No admin panel |
| **contact user** (6 types) | None (member role) | ❌ No admin panel |

---

## Contact Types (6)

| Type | Persian | Can Login | Description |
|------|---------|-----------|-------------|
| `customer` | مشتری | ✅ | End buyer, has wallet |
| `wholesaler` | بنکدار و کیفی | ✅ | Bulk gold/silver supplier |
| `melted_gold_seller` | آبشده فروش | ✅ | Melted gold supplier |
| `goldsmith` | طلاساز | ✅ | Jewelry maker/craftsperson |
| `coin_seller` | سکه فروش | ✅ | Coin dealer |
| `money_changer` | صراف | ✅ | Currency/gold exchanger |

Each contact type can log in as a user. Their `tenant_user.role` is `member` (no admin access).

---

## Non-User Contacts (no login)

| Name | Phone | Type | Tenant |
|------|-------|------|--------|
| شرکت طلاسازی البرز | 02188001001 | goldsmith | talana |
| صرافی ملی | 02188002002 | money_changer | talana |
| نقره‌کار تبریز | 04133001001 | goldsmith | silver-bazaar |

---

## Total Counts

| Entity | Count |
|--------|-------|
| Tenants | 5 |
| Sellers (غرفه) | 6 |
| Users (total) | 52 |
| Staff users | 12 |
| Contact users (with login) | 16 |
| Non-user contacts | 3 |
| Demo customers | 8 |
| Tenant admins | 5 |
| Superadmin | 1 |
| Products | 17 |

---

## Quick Test Scenarios

1. **Superadmin**: `09123456789` / `password` → full platform control
2. **Store admin**: `09120000003` (پارس) → manage own store, see branches tab
3. **Marketplace manager**: `09130000001` (طلانا) → can manage products/orders/reports
4. **Marketplace staff**: `09130000002` (طلانا) → limited access, no products management
5. **Marketplace seller**: `09130000003` (طلانا) → can manage products + orders (booth owner)
6. **Contact user (گoldsmith)**: `09135000004` (طلاساز البرز) → logs in, sees member view, no admin panel
7. **Contact user (صراف)**: `09135000006` (صراف ارز طلا) → logs in, member view
8. **Regular buyer**: `09121111111` (علی رضایی) → full marketplace access, no admin panel
