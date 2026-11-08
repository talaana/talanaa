# Talana Admin Panel — Features & Pricing

## Iranian Gold Market Pricing (قیمت‌گذاری طلا)

### Formula (based on Iranian gold union standards)

```
Raw Gold Value = وزن (گرم) × قیمت تابلو
Wage (اجرت)   = Raw Gold × (درصد اجرت / 100)
Profit (سود)  = (Raw Gold + Wage) × (درصد سود / 100)
Tax (مالیات)  = (Wage + Profit) × (درصد مالیات / 100)
Final Price   = Raw Gold + Wage + Profit + Tax
```

**Defaults:**
- Tablo price: daily 18k rate (updated every 2 hours in seeder)
- Profit: 7% (standard retail margin per union rules)
- Tax: 10% VAT for tax year 1405 (only on wage + profit — raw gold is tax-exempt; rate is versioned per tax year)
- Wage: varies by product (4-25%)

### Contact-Type Margins

Different contact types get different buy/sell rates relative to tablo price:

| Contact Type | Buy Discount | Sell Premium | Use Case |
|-------------|-------------|-------------|----------|
| **customer** (مشتری) | 0% | 0% | End buyer, no special rate |
| **wholesaler** (بنکدار) | 1.0% below tablo | 1.5% above tablo | Bulk transactions |
| **melted_gold_seller** (آبشده فروش) | 0.5% below tablo | 2.0% above tablo | Raw melted gold |
| **goldsmith** (طلاساز) | 1.5% below tablo | 3.0% above tablo | Craft work margin |
| **coin_seller** (سکه فروش) | 0% | 5.0% above tablo | Coin premium |
| **money_changer** (صراف) | 0.5% below tablo | 0.5% above tablo | Tight spread |

**Example:** Buying 10g of melted gold from a wholesaler at tablo price 8,650,000 Toman/g:
- Wholesaler buy rate: 8,650,000 × 0.99 = 8,563,500 Toman/g
- Total: 10 × 8,563,500 = 85,635,000 Toman

---

## Admin Panel Features

### 1. Dashboard (داشبورد)

**Endpoint:** `GET /api/admin/dashboard/stats`

| Metric | Description |
|--------|-------------|
| `total_users` | Total platform users |
| `total_tenants` | Active tenants |
| `total_transactions` | All transactions |
| `total_revenue` | Sum of buy_gold transactions |
| `active_orders` | Pending orders |
| `total_products` | All products |
| `total_contacts` | All contacts |

**Permissions required:** `admin.access`

---

### 2. Products Management (مدیریت محصولات)

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/products` | List products (paginated, filterable) |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/{id}` | Update product |
| DELETE | `/api/admin/products/{id}` | Soft delete (sets is_active=false) |
| GET | `/api/admin/pricing/calculate` | Calculate price without saving |
| GET | `/api/admin/pricing/tablo` | Current tablo prices |

**Filters:** `metal`, `category_id`, `seller_id`, `search`, `is_active`

**Features:**
- Each product in list includes `calculated_price` with full breakdown (raw_gold, wage, profit, tax, final_price)
- Tablo prices fetched from `gold_prices` table (latest record per metal)
- Wage/tax percentages configurable per product
- Supports gold + silver products
- Seller association (marketplace) or direct (standalone store)

**Permissions required:** `products.manage`

---

### 3. Orders Management (مدیریت سفارشات)

**Endpoint:** `GET /api/admin/orders`

**Features:**
- Paginated list of all transactions
- Includes user info for each transaction
- Sorted by date descending

**Permissions required:** `orders.manage`

---

### 4. Contacts Management (مدیریت مخاطبین)

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/contacts` | List contacts (paginated, filterable by type) |
| POST | `/api/admin/contacts` | Create contact |
| PUT | `/api/admin/contacts/{id}` | Update contact |
| DELETE | `/api/admin/contacts/{id}` | Soft delete |

**Contact Types:**
- `customer` (مشتری)
- `wholesaler` (بنکدار و کیفی)
- `melted_gold_seller` (آبشده فروش)
- `goldsmith` (طلاساز)
- `coin_seller` (سکه فروش)
- `money_changer` (صراف)

**Features:**
- Filter contacts by type
- Search by name or phone
- Notes field for additional info
- Tenant-scoped (each tenant sees only their contacts)

**Permissions required:** `admin.access` (any admin role can manage contacts)

---

### 5. Role-Based Access Control

| Role | Dashboard | Products | Orders | Sellers | Branches | Contacts | Users |
|------|-----------|----------|--------|---------|----------|----------|-------|
| **superadmin** | All tenants | All | All | All | All | All | All |
| **admin** | ✅ | ✅ | ✅ | ✅ (M) | ✅ (S) | ✅ | ✅ |
| **manager** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **staff** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **seller** | ✅ | ✅ (own) | ✅ (own) | ❌ | ❌ | ✅ | ❌ |
| **seller_staff** | ✅ | ❌ | ✅ (own) | ❌ | ❌ | ✅ | ❌ |

M = Marketplace only, S = Store only

---

## API Reference

### Pricing Endpoints

**Calculate price:**
```
GET /api/admin/pricing/calculate?metal=gold&weight=4.25&wage_percentage=12&tax_percentage=9
```
Response:
```json
{
  "raw_gold": 36762500,
  "wage": 4411500,
  "profit": 2882180,
  "tax": 656431,
  "final_price": 44712611,
  "per_gram": 10520614,
  "tablo_price": 8650000,
  "wage_percentage": 12,
  "tax_percentage": 9,
  "profit_percentage": 7
}
```

**Tablo prices:**
```
GET /api/admin/pricing/tablo
```
Response:
```json
{
  "gold_18k": 8650000,
  "silver_999": 125000,
  "timestamp": "2026-08-02T12:00:00+00:00"
}
```

---

## Test Coverage

| Test File | Tests | Focus |
|-----------|-------|-------|
| AdminPanelFeaturesTest | 16 | Pricing, Products CRUD, Contacts CRUD, Orders, Dashboard, ACL |
| StaffRolesAndContactsTest | 11 | Staff permissions, seller staff, contacts |
| AuthAndTenantTest | 13 | Auth flow, tenant resolution |
| MarketplaceBuyerJourneyTest | 12 | Buyer lifecycle |
| StandaloneStoreJourneyTest | 25 | Store admin, impersonation |
| MarketplaceVsStoreArchitectureTest | 19 | Architecture distinction |
| OtpLoginTest | 7 | OTP login |
| **Total** | **103** | **293 assertions** |

### Key Pricing Test
The gold pricing formula is unit-tested with known values:
- Raw gold: 1g × 10M = 10,000,000
- Wage: 10M × 12% = 1,200,000
- Profit: (10M + 1.2M) × 7% = 784,000
- Tax: (1.2M + 0.784M) × 10% = 198,400
- Final: 12,182,400 Toman ✓
