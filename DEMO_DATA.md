# Talana — Demo Data Reference

All test accounts use password: `password` | All OTP codes: `111111`

---

## Architecture Overview

```
طلانا (marketplace)           بازار نقره (marketplace)       گالری الماس (store)
├── گالری زرین (seller)       ├── گالری نقره (seller)         (no sellers — direct products)
├── جواهری محمد (seller)      └── هنر نقره (seller)
├── طلای ناب (seller)         
└── طلا و جواهر مهر (seller)  طلافروشی پارس (store)
                               جواهری تهران (store)
```

---

## Superadmin (Full Platform Control)

| Phone | Password | Name | Role | Wallet |
|-------|----------|------|------|--------|
| `09123456789` | `password` | احسان مرادی | superadmin | 2.458g gold / 42.5g silver / 8,450,000T |

**Access:** Login → click "پنل مدیریت" in sidebar → full tenant/user/role management

---

## Marketplace 1: طلانا

| Property | Value |
|----------|-------|
| Slug | `talana` |
| Type | marketplace |
| Domain | talana.ir |
| Admin phone | `09123456789` (superadmin) |
| Access URL | `http://localhost:5175/?tenant=talana` |

### Sellers (غرفه‌ها) inside طلانا

| Seller | City | Rating | Products |
|--------|------|--------|----------|
| گالری زرین | تهران | 4.9 | انگشتر اسلیمی, سرویس عروس, پلاک سفارشی, انگشتر نقره فیروزه, گردنبند نقره |
| جواهری محمد | اصفهان | 4.7 | گردنبند کارتیه, سکه بهار آزادی, گردنبند نقره ماه و ستاره |
| طلای ناب | یزد | 4.8 | دستبند زنجیری, شمش طلا ۵g, دستبند نقره کارتیر, شمش نقره ۱۰۰g |
| طلا و جواهر مهر | شیراز | 4.6 | گوشواره میخی, دستبند کارکرده, گوشواره نقره پروانه |

### طلانا Marketplace Products (14 total)

| # | Seller | Title | Metal | Weight | Wage% | Category |
|---|--------|-------|-------|--------|-------|----------|
| 1 | گالری زرین | انگشتر طلای طرح اسلیمی ۱۸ عیار ⭐ | gold | 4.25g | 12% | ring |
| 2 | جواهری محمد | گردنبند کارتیه کلاسیک طلایی ⭐ | gold | 12.80g | 15% | necklace |
| 3 | طلای ناب | دستبند زنجیری البرز با آویز قلب ⭐ | gold | 6.40g | 14% | bracelet |
| 4 | طلا و جواهر مهر | گوشواره میخی طرح گل هشت‌پر | gold | 2.15g | 18% | earring |
| 5 | گالری زرین | سرویس کامل عروس طرح برلیان ⭐ | gold | 28.50g | 20% | service |
| 6 | طلای ناب | شمش طلای ۲۴ عیار ۵ گرمی | gold | 5.00g | 4% | bar |
| 7 | جواهری محمد | سکه تمام بهار آزادی طرح جدید | gold | 8.13g | 2% | coin |
| 8 | طلا و جواهر مهر | دستبند پهن کارکرده بدون اجرت ♻️ | gold | 9.30g | 0% | secondhand |
| 9 | گالری زرین | طراحی سفارشی پلاک طلا 🎨 | gold | 3.50g | 25% | custom |
| 10 | گالری زرین | انگشتر نقره طرح نگین فیروزه ⭐ | silver | 3.80g | 15% | ring |
| 11 | جواهری محمد | گردنبند نقره مدل ماه و ستاره ⭐ | silver | 5.40g | 18% | necklace |
| 12 | طلای ناب | دستبند نقره مردانه طرح کارتیر ⭐ | silver | 18.50g | 10% | bracelet |
| 13 | طلا و جواهر مهر | گوشواره نقره بخیه‌ای طرح پروانه | silver | 2.30g | 20% | earring |
| 14 | طلای ناب | شمش نقره خالص ۱۰۰ گرمی | silver | 100.00g | 3% | bar |

⭐ = featured | ♻️ = second-hand | 🎨 = custom order

### طلانا Demo Customers

| Phone | Name | Wallet |
|-------|------|--------|
| `09121111111` | علی رضایی | 1.5g gold / 20g silver / 5,000,000T |
| `09122222222` | مریم حسینی | 3.2g gold / 35g silver / 12,000,000T |
| `09123333333` | حسین محمدی | 0.8g gold / 10g silver / 3,000,000T |

---

## Marketplace 2: بازار نقره

| Property | Value |
|----------|-------|
| Slug | `silver-bazaar` |
| Type | marketplace |
| Domain | silver.talana.app |
| Admin phone | `09120000001` |
| Admin name | مدیر بازار نقره |
| Access URL | `http://localhost:5175/?tenant=silver-bazaar` |

### Sellers inside بازار نقره

| Seller | City | Rating | Products |
|--------|------|--------|----------|
| گالری نقره | تبریز | 4.8 | دستبند نقره دست‌ساز تبریز ⭐, انگشتر نقره نگین عقیق |
| هنر نقره | مشهد | 4.5 | گردنبند نقره طرح خورشید ⭐ |

### بازار نقره Demo Customers

| Phone | Name | Wallet |
|-------|------|--------|
| `09124444444` | زهرا احمدی | 0g gold / 80g silver / 8,000,000T |
| `09125555555` | رضا کریمی | 0.5g gold / 120g silver / 15,000,000T |

---

## Standalone Store 3: گالری الماس

| Property | Value |
|----------|-------|
| Slug | `diamond-gallery` |
| Type | store |
| Domain | diamond.talana.app |
| Admin phone | `09120000002` |
| Admin name | مدیر گالری الماس |
| Access URL | `http://localhost:5175/?tenant=diamond-gallery` |

### Products (direct — no sellers)

| Title | Metal | Weight | Wage% |
|-------|-------|--------|-------|
| انگشتر الماس ۲۴ عیار ⭐ | gold | 3.20g | 25% |

### Demo Customers

| Phone | Name | Wallet |
|-------|------|--------|
| `09126666666` | سارا موسوی | 2.0g gold / 0g silver / 20,000,000T |

---

## Standalone Store 4: طلافروشی پارس

| Property | Value |
|----------|-------|
| Slug | `pars-gold` |
| Type | store |
| Domain | pars.talana.app |
| Admin phone | `09120000003` |
| Admin name | مدیر طلافروشی پارس |
| Access URL | `http://localhost:5175/?tenant=pars-gold` |

### Products

| Title | Metal | Weight | Wage% |
|-------|-------|--------|-------|
| دستبند طلای پارس ۱۸ عیار ⭐ | gold | 11.00g | 14% |

### Demo Customers

| Phone | Name | Wallet |
|-------|------|--------|
| `09127777777` | امیر جعفری | 4.5g gold / 15g silver / 25,000,000T |

---

## Standalone Store 5: جواهری تهران

| Property | Value |
|----------|-------|
| Slug | `tehran-jewelry` |
| Type | store |
| Domain | tehran.talana.app |
| Admin phone | `09120000004` |
| Admin name | مدیر جواهری تهران |
| Access URL | `http://localhost:5175/?tenant=tehran-jewelry` |

### Products

| Title | Metal | Weight | Wage% |
|-------|-------|--------|-------|
| گوشواره طلای تهران ⭐ | gold | 4.80g | 18% |

### Demo Customers

| Phone | Name | Wallet |
|-------|------|--------|
| `09128888888` | نرگس صادقی | 1.2g gold / 25g silver / 7,000,000T |

---

## Quick Test Scenarios

### As a buyer (no admin panel visible)
1. Open `http://localhost:5175/?tenant=talana`
2. Click OTP tab → enter `09121111111` → click "دریافت کد تأیید"
3. Enter `111111` → click "تأیید و ورود"
4. You should see: Home, Vitrine, Trade, Services tabs
5. **Admin panel button should NOT be visible** (no `admin.access` permission)
6. Browse Vitrine → see seller names on products
7. Click "خرید و فروش" → investment tab available

### As a store admin
1. Open `http://localhost:5175/?tenant=pars-gold`
2. Login with `09120000003` / `password`
3. You should see: Home, Products (only 2 tabs — no investment, no services)
4. **Admin panel button SHOULD be visible** (has `admin.access`)
5. Enter admin panel → see "شعب" tab (branches) instead of "فروشندگان" (sellers)

### As superadmin
1. Open `http://localhost:5175/?tenant=talana`
2. Login with `09123456789` / `password`
3. Enter admin panel → full dark sidebar: Dashboard, Stores, Users, Roles
4. Click "فروشگاه‌ها" → see all 5 tenants
5. Click "ورود به فروشگاه" on any tenant → impersonate

### As a marketplace admin
1. Open `http://localhost:5175/?tenant=silver-bazaar`
2. Login with `09120000001` / `password`
3. Enter admin panel → amber sidebar: Dashboard, Orders, Products, Sellers, Users
4. "فروشندگان" tab visible (marketplace admins manage sellers)

### Standalone store — no seller info leak
1. Open `http://localhost:5175/?tenant=tehran-jewelry`
2. Login with `09128888888` / `password`
3. Browse Products tab → products show NO seller name
4. No seller list section visible
5. No investment tab, no services tab

---

## All Accounts Quick Reference

| Phone | Name | Role | Tenant |
|-------|------|------|--------|
| `09123456789` | احسان مرادی | superadmin | talana |
| `09120000001` | مدیر بازار نقره | admin | silver-bazaar |
| `09120000002` | مدیر گالری الماس | admin | diamond-gallery |
| `09120000003` | مدیر طلافروشی پارس | admin | pars-gold |
| `09120000004` | مدیر جواهری تهران | admin | tehran-jewelry |
| `09121111111` | علی رضایی | buyer | talana |
| `09122222222` | مریم حسینی | buyer | talana |
| `09123333333` | حسین محمدی | buyer | talana |
| `09124444444` | زهرا احمدی | buyer | silver-bazaar |
| `09125555555` | رضا کریمی | buyer | silver-bazaar |
| `09126666666` | سارا موسوی | buyer | diamond-gallery |
| `09127777777` | امیر جعفری | buyer | pars-gold |
| `09128888888` | نرگس صادقی | buyer | tehran-jewelry |

**Every account:** password = `password`, OTP = `111111`
