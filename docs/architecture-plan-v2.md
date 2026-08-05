# Talana Architecture Plan — v2

## Current state (wrong assumptions)

| Table | Current purpose | What it should be |
|---|---|---|
| `users` | Staff + customers mixed together, everyone has wallet | **Staff only** — admins, managers, staff of a tenant. No personal wallet. |
| `contacts` | Cannot log in, no auth | **Customers/investors/traders** — can log in, always have wallet. The people who buy/sell gold. |
| `wallets` | Polymorphic, one per user | Two wallet types: contact wallets (always), tenant wallets (for the shop itself). |

---

## Core entities

### 1. Contact (customer/investor/supplier/partner)
- Logs into a specific tenant
- Always has a wallet (gold grams, silver grams, cash toman)
- Types: customer, supplier, manufacturer, wholesaler, retailer, broker
- Can buy gold from tenant, sell gold to tenant, request delivery, request refund
- All transactions via quotation workflow

### 2. User (staff)
- Works for a tenant (admin, manager, staff, seller)
- No personal wallet — staff don't trade for themselves through the platform
- Admin can grant staff access to the **tenant's wallet** (e.g. accountant, treasurer)
- This is a permission on the tenant wallet, not a separate staff wallet

### 3. Tenant (shop / marketplace / supplier)
- Has its own wallet (inventory + cash)
- The economic engine — buys from suppliers, sells to customers
- Revenue comes from spread between buy/sell rates
- Three tenant types with different panels and workflows

---

## Tenant types (three distinct business models)

### Type A: Marketplace (B2C + C2C)
- Public storefront: products listed by sellers, browsable by retail customers
- Customer panel: buy gold, sell gold, wallet, delivery, investment tracking
- Admin panel: manage sellers, products, orders, quotations, accounting
- **POS (Point of Sale)** — walk-in customers, instant buy/sell with receipt
- **Vendors** — each vendor has their own accounting, POS, inventory, invoices, bills, contacts
- Branches for marketplace: not needed yet (skipped)
- Example: طلانا (talana) — the main gold marketplace
- **Frontend**: retail site (like current talana-sage.vercel.app)

### Type B: Store (standalone B2C)
- Public storefront but no sellers — the store IS the seller
- Same customer panel as marketplace
- Simpler admin panel (no seller management)
- **POS (Point of Sale)** — for walk-in customers, instant buy/sell with receipt
- **Multi-branch** — each branch has its own inventory, accounting, POS. Staff can switch between branches. Consolidated view across all branches.
- Example: a single jewelry shop running on Talana
- **Frontend**: retail site (branded to the store)

### Type C: Supplier (B2B) — NEW
- **No public retail storefront needed** (or minimal)
- Back-office is the product — management, workflows, automations
- Supplies gold/silver to marketplaces and stores
- Participates in supplier bidding
- Manages own inventory, pricing, invoices, bills
- Has its own accounting and HR modules
- Receives instant notifications for bids, orders, payments
- **Frontend**: back-office panel (web first, then Blazor + MAUI for mobile/desktop)

---

## Gold & silver forms

Different physical forms of precious metals, each with distinct pricing.

| Form | Metal | Purity | Typical use | Pricing basis |
|---|---|---|---|---|
| 18k gold | Gold | 75% | Jewelry, retail | Live gold × 0.75 + making charge |
| 24k gold | Gold | 99.9% | Investment, bullion | Live gold + small premium |
| Gold coin (سکه) | Gold | 90-99.9% | Investment | Fixed premium over spot |
| Gold bullion (شمش) | Gold | 99.9% | Wholesale, investment | Spot + wholesale spread |
| Scrap gold (طلای دست دوم) | Gold | varies | Recycling | Live gold × purity − melt fee |
| 999 silver | Silver | 99.9% | Investment, bullion | Live silver + premium |
| 925 silver | Silver | 92.5% | Jewelry | Live silver × 0.925 + making charge |
| Silver bullion | Silver | 99.9% | Wholesale | Spot + wholesale spread |

### Pricing formulas per direction

Each role pair has its own calculation:

```
RETAILER → CUSTOMER (buy):
  price = (live_price × purity) × (1 + tenant_margin) + making_charge + tax

CUSTOMER → RETAILER (sell back):
  price = (live_price × purity) × (1 − tenant_spread) − melt_fee
  // Customer gets less than spot — tenant earns the spread

SUPPLIER → RETAILER (wholesale):
  price = (live_price × purity) × (1 + wholesale_premium) + volume_discount
  // B2B pricing with volume-based tiers

RETAILER → SUPPLIER (scrap/return):
  price = (live_price × purity) × (1 − supplier_spread) − processing_fee

SUPPLIER → SUPPLIER (inter-supplier):
  price = live_price × purity + negotiated_premium
  // B2B marketplace pricing
```

These formulas are configurable per tenant in their settings. A marketplace might have different margins than a standalone store. A supplier might offer volume discounts.

---

## Supplier tenant (Type C) — detailed

### What a supplier gets

**Back-office panel (web):**
- Dashboard: real-time gold/silver prices, inventory position, pending bids
- Inventory management: track gold/silver by form (coins, bullion, scrap, etc.)
- Quotations: incoming bids from retailers, outgoing quotes to other suppliers
- Orders: automated fulfillment from accepted bids
- Invoices & receipts: auto-generated for every transaction
- Bills: what the supplier owes to others
- Accounting: double-entry ledger, P&L, balance sheet
- HR: staff management, roles, permissions
- Pricing: configure margins, spreads, volume discounts per form
- Notifications: instant alerts for bids, orders, payments, price changes

**Mobile & desktop app (future — Blazor + MAUI):**
- Live price widgets on phone home screen
- Instant bid notifications (push)
- One-tap bid accept/reject
- Inventory at a glance
- Quick order fulfillment
- Offline-capable with sync

### Supplier onboarding flow
```
1. Supplier registers → creates tenant (type: supplier)
2. Gets back-office panel immediately
3. Configures pricing formulas for each gold/silver form
4. Sets up inventory (how much they have or can source)
5. Optionally: enable public profile in B2B marketplace directory
6. Starts receiving bid notifications from retailers
```

### B2B Marketplace (supplier directory)
- **Retailer panel** (shop or marketplace vendor): autocomplete search to find registered suppliers
- **Supplier panel**: autocomplete search to find registered retailers
- Searchable by name, phone, metal forms, location
- Only **registered** suppliers and retailers appear in the directory (must have an account)
- Compare: price per form, minimum order, delivery time, rating
- Direct B2B transactions (supplier→retailer) without bidding
- Bidding for competitive pricing (retailer posts need → suppliers bid)

---

## Authentication for contacts

**Option A: Add auth fields to contacts table** (recommended)
```
contacts:
  + phone (unique per tenant? or globally?)
  + password (hashed)
  + remember_token
```
- Clean: one entity = one table
- Contact IS the actor logging in
- Sanctum token attached to Contact model (needs `HasApiTokens` trait)

### Contact login flow
```
POST /api/auth/contact/login
Body: { phone, password, tenant_slug }

Response: {
  contact: { id, name, phone, type, ... },
  token: "...",
  type: "contact",
  wallet: { gold_grams, silver_grams, cash_toman },
  role: "customer",  // or supplier, etc.
  tenant: { id, name, slug, type }
}
```

### Staff login flow (existing, adjusted)
```
POST /api/auth/login
Body: { phone, password, tenant_slug }

Response: {
  user: { id, name, phone, ... },
  token: "...",
  type: "staff",
  role: "admin",     // from tenant_user pivot
  permissions: [...],
  is_superadmin: bool,
  can_access_tenant_wallet: bool,
  tenant: { id, name, slug, type }
}
```

---

## Wallet architecture

| Wallet owner | Table | Always exists? | Purpose |
|---|---|---|---|
| Contact | `wallets` (polymorph: contact) | **Yes** — auto-created on contact creation | Personal gold/silver/cash balance per tenant |
| Tenant | `wallets` (polymorph: tenant) | **Yes** — auto-created on tenant creation | Shop's inventory and cash reserve |
| Staff | no wallet | — | Staff don't have wallets; admin can grant them access to the **tenant wallet** via permission |

---

## Branches (retailer multi-branch)

Stores (Type B) can have multiple physical branches. Each branch is a sub-scope for inventory and accounting.

```sql
branches:
  id, tenant_id, name, slug, address, phone, is_active,
  created_at, updated_at
```

- **Per-branch scope**: inventory, accounting, POS transactions are tagged with `branch_id`
- **Staff branch assignment**: staff belong to one or more branches, can switch in the panel
- **Consolidated view**: tenant-level reports aggregate all branches
- **Branch switch**: staff select active branch from a dropdown; all subsequent operations are scoped to that branch
- Marketplace branches: not needed yet (vendors serve this role)

Branch-scoped tables get a `branch_id` foreign key:
- `products` (optional — branch-specific inventory levels)
- `pos_transactions`
- `accounting_entries`
- `invoices`, `bills`

---

## Transaction flows

### Flow A: Contact buys gold from tenant
```
1. Contact submits buy request (market order or quoted)
2. System calculates price based on form + direction formula
3. If contact has enough cash in wallet → auto-execute
4. If not → create quotation, contact can pay later
5. On execution:
   - Contact wallet: cash_toman -= amount, gold_grams += weight
   - Tenant wallet: gold_grams -= weight, cash_toman += amount
   - Accounting entry recorded (double-entry)
```

### Flow B: Contact sells gold to tenant
```
1. Contact submits sell quotation
2. System calculates buyback price using sell formula
3. Tenant admin reviews and approves/rejects
4. On approval:
   - Contact wallet: gold_grams -= weight, cash_toman += amount
   - Tenant wallet: gold_grams += weight, cash_toman -= amount
   - Payment to contact's registered card number
   - Accounting entry recorded
```

### Flow C: Contact requests physical delivery
```
1. Contact has enough gold grams in wallet
2. Submits delivery quotation
3. System calculates: weight × (live_price − delivery_fee)
4. Tenant approves → delivery scheduled
5. Wallet deducted, accounting entry recorded
```

### Flow D: Supplier bidding (out-of-stock)
```
1. Customer wants to buy gold → tenant has insufficient inventory
2. System creates a supplier quotation for the specific form + quantity
3. Broadcasts to all suppliers (tenant type C) in the B2B marketplace
4. First supplier to approve → auto-accepts
5. On fulfillment:
   - Tenant wallet: gold_grams += weight (from supplier)
   - Supplier's contact wallet: gold_grams -= weight, cash_toman += amount
   - Customer's contact wallet: gold_grams += weight, cash_toman -= amount
   - Tenant earns spread between customer price and supplier price
   - Invoice for supplier, bill for tenant
```

### Flow E: Direct B2B (supplier → retailer)
```
1. Retailer browses B2B marketplace, finds supplier
2. Retailer places order for specific form + quantity
3. Supplier approves → auto-execute
   - Supplier wallet: gold_grams -= weight, cash_toman += wholesale_price
   - Retailer tenant wallet: gold_grams += weight, cash_toman -= wholesale_price
   - Invoice for retailer, receipt for supplier
```

---

## Quotation system

```sql
quotations:
  id, tenant_id,
  sender_type, sender_id,
  recipient_type, recipient_id,
  type: buy | sell | delivery | refund | supplier_bid | b2b_order
  metal: gold | silver
  form: 18k | 24k | coin | bullion | scrap | 999_silver | 925_silver
  weight_grams,
  price_per_gram_toman,
  making_charge,
  tax_toman,
  total_toman,
  status: pending | approved | rejected | expired | executed
  card_number,
  delivery_address,
  notes,
  expires_at,
  created_at, updated_at
```

---

## Accounting system

```sql
accounting_entries:
  id, tenant_id,
  transaction_type,
  debit_account,
  credit_account,
  metal: gold | silver,
  form: 18k | 24k | coin | bullion | scrap | 999_silver | 925_silver,
  weight_grams,
  cash_toman,
  rate_per_gram,
  quotation_id,
  reference_type, reference_id,
  description,
  created_at
```

### Reports
- Balance sheet: tenant's assets by form, liabilities
- Profit/Loss: spread per transaction type
- Contact ledger: individual contact's history
- Inventory report: holdings by form
- Supplier performance: fulfillment speed, pricing competitiveness
- Form-level analytics: which forms trade most, margins per form

---

## Migration plan

### Phase 1: Contact authentication (enable login)
1. Add `phone`, `password`, `remember_token` columns to `contacts` table
2. Add `HasApiTokens` trait to `Contact` model
3. Create `ContactAuthController` (login, logout, profile, OTP)
4. Add routes: `/api/auth/contact/*`
5. Frontend: contact login page separate from staff login
6. Auto-create wallet on contact creation

### Phase 2: Gold/silver forms
1. Create `metal_forms` table (or enum/config)
2. Add `form` column to products, quotations, transactions, accounting_entries
3. Pricing formula engine — configurable per tenant per form per direction
4. Tenant settings page for configuring margins/spreads

### Phase 3: Supplier tenant type
1. Add `supplier` to tenant types
2. Supplier back-office panel (new frontend routes)
3. B2B marketplace directory
4. Bid notification system (real-time)
5. Invoice/receipt/bill auto-generation for suppliers

### Phase 4: Wallet corrections
1. Remove auto-creation of wallets for `users` (staff)
2. Add `can_access_tenant_wallet` to `tenant_user` pivot
3. Ensure tenant wallets exist for all active tenants

### Phase 5: Quotation workflows
1. Extend quotations with all types, metal forms
2. Contact buy/sell/delivery/refund flows
3. Supplier bidding broadcast
4. Direct B2B ordering

### Phase 6: Accounting
1. Double-entry accounting with metal form tracking
2. P&L, balance sheet, inventory reports
3. Real-time position tracking

### Phase 7: Native apps (future)
1. Blazor Hybrid + MAUI for supplier panel
2. Mobile widgets (price, bids, inventory)
3. Push notifications for bids, orders, payments

---

## Open questions

1. **Contact phone uniqueness**: Per tenant or globally?
2. **Contact type on registration**: Self-selected or admin-assigned?
3. **Supplier bidding timeout**: How long before a bid expires?
4. **Delivery logistics**: Who handles physical delivery?
5. **Card number storage**: Encrypted? Per contact or per quotation?
6. **Volume discount tiers**: Fixed tiers or configurable per supplier?
7. **Supplier verification**: How do we verify a supplier is legitimate before they can bid?
8. **B2B marketplace fees**: Does the platform take a commission on B2B transactions or is it subscription-based?
