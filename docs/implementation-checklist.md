# Talana Implementation Checklist

## Phase 1: Contact Authentication
- [ ] Add `phone`, `password`, `remember_token` to `contacts` migration
- [ ] Add `otp_code`, `otp_expires_at` to contacts (for OTP login)
- [ ] Add `HasApiTokens` trait to `Contact` model
- [ ] Make `Contact` implement `Authenticatable` contract
- [ ] Create `ContactAuthController` (login, register, logout, profile, requestOtp, verifyOtp)
- [ ] Update `ContactAuthController` login/register to accept `tenant_slug` and auto-link via `tenant_user` or `contact_tenant` pivot
- [ ] Create `authPayload` for contacts (type: "contact", role, wallet)
- [ ] Add routes: `POST /api/auth/contact/login`, `/register`, `/logout`, `/otp/request`, `/otp/verify`, `GET /profile`
- [ ] Auto-create wallet on contact creation (polymorph)
- [ ] Add `EnsureTenantAccess` support for contacts (or separate middleware)
- [ ] Frontend: contact login page (separate from staff, branded per tenant)
- [ ] Frontend: store contact auth context in cookie (`talana_auth_{slug}`)
- [ ] Frontend: contact-side API client with `talana_token_{slug}` cookie + `X-Tenant` header
- [ ] Database seeder: create test contacts with known passwords
- [ ] Tests: contact can register, login, see profile, access tenant-scoped data
- [ ] Tests: contact from tenant A cannot access tenant B
- [ ] Remove auto-creation of wallets for `users` (staff — they don't have wallets)
- [ ] Add `can_access_tenant_wallet` to `tenant_user` pivot migration
- [ ] Update staff login response: remove `wallet` field, add `can_access_tenant_wallet`

## Phase 2: Gold & Silver Forms
- [ ] Create `metal_forms` table or config (18k, 24k, coin, bullion, scrap, 999_silver, 925_silver)
- [ ] Add `form` column to `products` table
- [ ] Add `form` column to `quotations` table
- [ ] Add `form` column to `transactions` table
- [ ] Add `form` column to `accounting_entries` table
- [ ] Pricing engine: per-form, per-direction formulas configurable per tenant
- [ ] Tenant settings page: configure margins, spreads, making charges per form
- [ ] API endpoint: `GET /prices/calculate?form=18k&direction=retailer_to_customer&weight=10`
- [ ] Update product creation to include form selection
- [ ] Update POS to select form before transaction
- [ ] Tests: each form calculates correct price per direction

## Phase 3: Supplier Tenant Type
- [ ] Add `supplier` to tenant types enum
- [ ] Supplier registration flow (TenantRegistrationController or separate)
- [ ] Supplier back-office panel (new frontend routes under `/supplier`)
- [ ] Supplier dashboard: live prices, inventory, pending bids
- [ ] Supplier inventory management (by form)
- [ ] Supplier pricing configuration (margins per form, volume discounts)
- [ ] B2B marketplace directory API: `GET /api/b2b/suppliers?search=...`
- [ ] B2B marketplace directory API: `GET /api/b2b/retailers?search=...`
- [ ] Autocomplete search by name, phone, metal forms, location
- [ ] Only registered contacts appear in directory
- [ ] Direct B2B order: retailer → supplier (no bidding)
- [ ] Bid notification system (real-time / polling)
- [ ] Supplier can accept/reject bids
- [ ] Invoice auto-generation for fulfilled B2B orders
- [ ] Frontend: supplier panel — bid inbox, order history, pricing config
- [ ] Tests: supplier registration, B2B directory, bid flow

## Phase 4: Branches
- [ ] Create `branches` table migration
- [ ] Add `branch_id` to `pos_transactions`
- [ ] Add `branch_id` to `accounting_entries`
- [ ] Add `branch_id` to `invoices`
- [ ] Add `branch_id` to `bills`
- [ ] Branch CRUD API (admin only)
- [ ] Staff-branch assignment (many-to-many pivot or `tenant_user` column)
- [ ] Branch switcher in store admin panel
- [ ] Per-branch scoping middleware (reads active branch from header/session)
- [ ] Consolidated reports: aggregate all branches for tenant-level view
- [ ] Tests: branch-scoped POS, branch-switched staff, consolidated reports

## Phase 5: Quotation Workflows
- [ ] Extend quotations: add `form`, `metal`, all types (buy, sell, delivery, refund, supplier_bid, b2b_order)
- [ ] Contact buy flow: submit → calculate → auto-execute or create quotation
- [ ] Contact sell flow: submit quotation → admin approve → execute
- [ ] Delivery request flow: submit → admin approve → deduct wallet
- [ ] Refund flow: submit → admin approve → pay to card
- [ ] Supplier bid flow: create → broadcast → first-accept → auto-fulfill
- [ ] Supplier bid timeout (auto-reject after N hours)
- [ ] B2B direct order flow: retailer → supplier → accept → execute
- [ ] Quotation status notifications (real-time)
- [ ] Frontend: contact quotation dashboard (pending, approved, rejected)
- [ ] Frontend: admin quotation review panel
- [ ] Tests: full buy/sell/delivery/refund/bid lifecycles

## Phase 6: Accounting
- [ ] Double-entry accounting with metal form + branch tracking
- [ ] Every transaction creates at least two accounting entries
- [ ] Balance sheet report: assets by form, liabilities, equity
- [ ] Profit & Loss report: spread per transaction type
- [ ] Contact ledger: individual contact transaction history
- [ ] Inventory report: holdings by form, by branch
- [ ] Supplier performance report: fulfillment speed, pricing
- [ ] Real-time position tracking (tenant-level, branch-level, vendor-level)
- [ ] Frontend: accounting dashboard with charts
- [ ] Frontend: export reports (PDF/Excel)
- [ ] Tests: accounting entries created correctly, reports match transactions

## Phase 7: Native Apps (Future — Blazor + MAUI)
- [ ] Supplier panel as Blazor Hybrid app
- [ ] Mobile widgets: live prices, pending bids, inventory
- [ ] Push notifications for bids, orders, payments
- [ ] Offline-capable with sync
- [ ] Desktop app (MAUI) for supplier back-office
