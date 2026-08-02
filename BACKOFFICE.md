# Talana Back-Office — Complete Feature Reference

## Architecture

```
POS (صندوق) ──────► Accounting (حسابداری)
   │                      │
   ├── Invoice (فاکتور) ──┤
   │                      │
   └── Bill (قبض) ────────┘

Reports (گزارشات) ◄── All modules combined
```

---

## 1. POS — Point of Sale (صندوق فروش)

Buy/sell gold and silver with automatic pricing.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/pos` | admin.access | List transactions (paginated, filterable) |
| POST | `/api/admin/pos` | admin.access | Create transaction |

**Filters:** type, status, metal, from, to, contact_id

**POST body:**
```json
{
  "type": "buy_gold",
  "weight_grams": 10,
  "metal": "gold",
  "contact_id": 1,
  "payment_method": "cash"
}
```

**Payment methods:** cash, wallet, bank_transfer, cheque

**Auto-generated:** invoice_number (POS-YYYYMMDD-XXXXXX), accounting entry, contact margin applied

---

## 2. Accounting — حسابداری

Double-entry ledger for all financial transactions.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/accounting` | admin.access | Journal entries (paginated) |
| GET | `/api/admin/accounting/balance` | admin.access | Current balance |

**Filters:** type (income/expense), category (gold_trade/service/wage/tax/fee/other), from, to

**Balance response:**
```json
{
  "total_income": 2500000000,
  "total_expense": 1800000000,
  "current_balance": 700000000,
  "currency": "IRR"
}
```

---

## 3. Invoices — فاکتورها

Issue invoices to contacts. Auto-creates receivable bills.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/invoices` | admin.access | List invoices |
| POST | `/api/admin/invoices` | admin.access | Create invoice |
| POST | `/api/admin/invoices/{id}/pay` | admin.access | Record payment |

**Filters:** type, status, contact_id, search (invoice number)

**Invoice types:** sale, purchase, service

**Auto-creates:** Bill (receivable for sale, payable for purchase), Accounting entry on payment

---

## 4. Bills — قبوض

Track payables and receivables to contacts.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/bills` | admin.access | List bills with stats |
| POST | `/api/admin/bills/{id}/pay` | admin.access | Record payment |

**Filters:** type (payable/receivable), status (pending/paid/overdue), contact_id

**Stats included:** total_payable, total_receivable

---

## 5. Reports — گزارشات

Financial summaries with period filtering.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/reports/summary` | admin.access | Financial summary |

**Parameters:** from, to (date range, defaults to current month)

**Response:**
```json
{
  "period": {"from": "2026-08-01", "to": "2026-08-31"},
  "pos": {
    "transaction_count": 42,
    "total_buys": 850000000,
    "total_sells": 1200000000,
    "gross_profit": 350000000
  },
  "metals": {
    "gold_bought_grams": 120.5,
    "gold_sold_grams": 85.3,
    "silver_bought_grams": 500,
    "silver_sold_grams": 320
  },
  "invoices": {"count": 15, "total": 450000000},
  "balance": 250000000,
  "currency": "IRR"
}
```

---

## 6. Gold Pricing — قیمت‌گذاری طلا

### Formula (Iranian gold union standard)

```
Raw Gold = وزن × قیمت تابلو
Wage    = Raw × (%اجرت)
Profit  = (Raw + Wage) × 7%
Tax     = (Wage + Profit) × 9%
Final   = Raw + Wage + Profit + Tax
```

### Contact Margins

| Contact Type | Buy Discount | Sell Premium |
|-------------|-------------|-------------|
| customer | 0% | 0% |
| wholesaler | 1.0% | 1.5% |
| melted_gold_seller | 0.5% | 2.0% |
| goldsmith | 1.5% | 3.0% |
| coin_seller | 0% | 5.0% |
| money_changer | 0.5% | 0.5% |

---

## 7. Complete Business Flow

```
1. Add contact (wholesaler/customer)
   POST /api/admin/contacts

2. Buy gold from wholesaler via POS
   POST /api/admin/pos {type: "buy_gold", contact_id: X}

3. Sell to customer — create invoice
   POST /api/admin/invoices {contact_id: Y, items: [...]}

4. Customer pays invoice
   POST /api/admin/invoices/{id}/pay

5. Check financial health
   GET /api/admin/reports/summary
   GET /api/admin/accounting/balance
```

---

## Test Coverage

| Test File | Tests | Focus |
|-----------|-------|-------|
| BackOfficeFlowTest | 16 | Full business flows: POS, accounting, invoices, bills, reports |
| AdminPanelFeaturesTest | 16 | Products CRUD, contacts CRUD, pricing |
| StaffRolesAndContactsTest | 11 | Staff permissions, seller staff |
| AuthAndTenantTest | 13 | Auth flow |
| MarketplaceBuyerJourneyTest | 12 | Buyer lifecycle |
| StandaloneStoreJourneyTest | 25 | Store admin |
| MarketplaceVsStoreArchitectureTest | 19 | Architecture |
| OtpLoginTest | 7 | OTP login |
| **Total** | **119** | **355 assertions** |

### Key Integration Test
- Full business flow: create wholesaler → buy gold via POS → invoice customer → customer pays → verify accounting balance > 0 → verify report data
