# مدل میزبان/سطح — ZarAsan پلتفرم، طلانا مارکت‌پلیس

**تاریخ:** 2026-11-16 · **وضعیت:** طراحی تأییدشده، هنوز اجرا نشده
**شاخهٔ مبنا:** `fix/apex-landing-app-split` (tip `a249bea`) — همان باندلی که امروز روی prod است؛ `main` این کد را ندارد و ادغامش تصمیم مالک است.
**دامنهٔ توافق‌شده:** لوله‌کشی میزبان‌ها + سطح‌های پلتفرم. صفحهٔ لندینگِ هر تننت برشِ بعدی است.

---

## ۱. مسئله، اندازه‌گیری‌شده

سه سطحی که مدل محصولی ما خواسته‌اند، امروز در prod وجود ندارند:

```
curl -sSI https://app.zaraasan.ir/ | sed -n '1,3p'   # → 301 Location: https://zaraasan.ir/
curl -sSI https://sa.zaraasan.ir/  | sed -n '1,3p'   # → 301 Location: https://zaraasan.ir/
```

هر دو ۳۰۱ را بلاکِ wildcardِ `server_name *.zaraasan.ir` در `/etc/nginx/sites-available/zaraasan` می‌دهد — همان بلاکی که عمداً نوشتم تا هیچ نامِ حدسی محتوای تکراری سرو نکند. حالا دو نام از آن مستثنا می‌شوند.

و یک نشتیِ جدا از میزبان: پنل سوپرادمین فقط با **نقش** گیت می‌شود، هرگز با میزبان. سه نقطهٔ تصمیم در فرانت‌اند، هیچ‌کدام `location.hostname` را نمی‌خوانند:

| نقطه | تصمیم امروز |
|---|---|
| `src/App.tsx` → مقدار اولیهٔ `showAdmin` و listenerِ `onHashChange` | آیا hash با `#/admin` \| `#/superadmin` \| `#/tenant` شروع می‌شود |
| `src/App.tsx` → `goToAdmin()` | `isSuperadmin ? '#/superadmin/dashboard' : '#/tenant/dashboard'` |
| `src/admin/AdminPanel.tsx` → `navigateTo()` | `prefix = isSuperadmin && !impersonatedTenant ? 'superadmin' : 'tenant'` |

پس `https://talaana.ir/#/superadmin/tenants` امروز برای هر کسی که نقش سوپرادمین دارد باز می‌شود، روی میزبانی که قرار است عمومی‌ترین میزبانِ ممکن باشد.

## ۲. واقعیت‌هایی که طراحی را قطعی می‌کنند

همه اندازه‌گیری‌شده‌اند، با فرمانِ قابلِ بازتولید:

1. **DNS و TLS لازم نیست.** `app.` و `sa.` به origin می‌رسند (خودِ پاسخ ۳۰۱ این را ثابت می‌کند) و گواهی `zaraasan-wildcard` هر دو را پوشش می‌دهد:
   `openssl x509 -in /etc/letsencrypt/live/zaraasan-wildcard/fullchain.pem -noout -text | grep -A1 "Subject Alternative Name"` → `DNS:zaraasan.ir, DNS:*.zaraasan.ir` (انقضا ۲۰۲۷-۰۲-۱۲).
2. **تننت برای یک میزبان بی‌تننت از سرور می‌آید.** `GET /api/auth/permissions` این را برمی‌گرداند: `{is_superadmin, permissions, roles, tenant{id,name,slug,type}}`؛ `tenant` از رابطهٔ `belongsTo` روی `users.tenant_id` می‌آید. پس `app.zaraasan.ir` بدون هیچ migration ای می‌تواند بعد از لاگین، پنل تننت کاربر را باز کند.
3. **سوپرادمین یک نقش است، نه یک تننت.** `User::isSuperAdmin()` == وجود ردیف `user_roles` با `roles.slug='superadmin'`. در prod حسابِ مدیر (user 1) هم `superadmin` (با `tenant_id` نال) و هم `tenant_admin_talana` (tenant_id=1) را دارد. پس گیت باید **میزبان × نقش** باشد؛ نقشِ تنها نمی‌تواند تصمیم بگیرد.
4. **دیتابیس prod خالی است:** `select count(*) from users` → ۱، `tenants` → ۲ (`talana` marketplace با `domain='talaana.ir'`، `pars-gold` store با `domain NULL`)، `tenant_user` → ۱. یعنی ریسکِ قفل‌شدنِ مشتری در بستنِ سوپرادمین روی میزبان‌های دیگر عملاً صفر است؛ تنها حسابی که مسیرش عوض می‌شود حسابِ خودِ مالک است.
5. **هیچ endpoint ای «تننت‌های من» را برنمی‌گرداند.** جستجو در `routes/api.php` و `app/Http/Controllers` هیچ متدی که `User::tenants()` را به کاربر برگرداند ندارد. پس کاربری که عضویتش فقط در pivot است و `users.tenant_id` اش خالیست، در `app.zaraasan.ir` بی‌تننت می‌ماند. راه‌حلِ این حالت در این دامنه نیست (§۸).
6. **دو منبع حقیقت برای nginx:** vhost زندهٔ `zaraasan` فقط در `/etc/nginx` است؛ چک‌اوتِ `/home/talana/www/talana-deploy/nginx/` آن را ندارد و نسخهٔ محلی `D:/talana/deploy/nginx/zaraasan.conf` دارد. یعنی مسیرِ مستندِ استقرار، این فایل را از بین می‌برد. باید در همین موج هم‌راستا شوند.
7. **تلهٔ build روی سرور:** `/home/talana/www/talana-frontend/.env.production` (بدون‌track) هنوز `VITE_BASE_DOMAIN=zaraasan.ir` دارد؛ اگر کسی از روی سرور rebuild کند، اصلاحِ دیروزِ `talaana.ir` برمی‌گردد.

## ۳. واژگان مدل

- **brand** — هویتی که کاربر می‌بیند: `zaraasan` (پلتفرم)، `talana` (مارکت‌پلیس)، یا هر تننت دیگر.
- **surface** — چیزی که روی یک میزبان سرو می‌شود: `landing` | `tenant-app` | `platform-app` | `superadmin`.
- **host class** — الگوی میزبان که surface را تعیین می‌کند (امروز: خودِ hostname؛ در آینده: `{slug}.ir` و `app.{slug}.ir`).

قاعدهٔ کلیدی: **میزبان surface را تعیین می‌کند، نقش فقط تعیین می‌کند کاربر به آن surface دسترسی دارد یا نه.** هیچ‌کدام به‌تنهایی کافی نیستند.

## ۴. تصمیم‌ها

**الف) یک باندل، تفکیک در کد (انتخاب شد).** `app.zaraasan.ir` و `sa.zaraasan.ir` همان `dist` را سرو می‌کنند که `talaana.ir` سرو می‌کند؛ رفتار از hostname شاخه می‌خورد. جایگزین‌ها: build و dist جدا برای هر سطح (سه‌برابر استقرار روی باکسی که أصلاً نمی‌تواند `vite build` بخورد — مرز امنیتی واقعی API است نه باندل، پس هزینه امنیت اضافه نمی‌خرد) یا rewrite در nginx با پارامتر `?surface=` (قرارداد را به URL نشت می‌دهد و در نهایت SPA باید همان را بخواند، یعنی منبع حقیقت دوگانه).

**ب) `TENANT_BASE_DOMAIN` روی `talaana.ir` می‌ماند.** امروز `<slug>.talaana.ir` برای فروشگاه‌ها کار می‌کند (اندازه‌گیری‌شده: `pars-gold.talaana.ir/#/login` با h1 «طلافروشی پارس»). گذاشتنش روی `zaraasan.ir` همان کاری است که draftِ روی سرور کرد و همهٔ میزبان‌های فعلی را ۳۰۱ به لندینگ می‌کرد. `zaraasan.ir` فقط surfaceهای پلتفرم را می‌گیرد؛ مهاجرت فروشگاه‌ها به `{slug}.ir`/`app.{slug}.ir` با DNS و گواهی هر تننت، برشِ بعدی است.

**ج) نه migration، نه رکوردِ `zaraasan`.** زرآسان پلتفرم است نه یک تننت؛ `sa.` از نقش کار می‌کند و `app.` از `permissions.tenant`. ستون `tenants.type` و مقدار بلااستفادهٔ `'platform'` دست‌نخورده می‌مانند (ردیفِ ساختگی فقط برای پرکردنِ یک enum، بعداً گمراه‌کننده است).

**د) بستنِ سوپرادمین روی میزبان‌های دیگر + ریدیرکت (تصمیم مالک).** `#/superadmin/*` تنها روی `sa.zaraasan.ir` رندر می‌شود؛ از هر میزبان دیگر با ناوبریِ کامل به همان مسیر روی `sa.` می‌رویم. مسیر همیشگیِ کاریِ مالک از این به بعد `sa.zaraasan.ir` است.

## ۵. قرارداد میزبان (normative)

اولین قاعده‌ای که matchup کند برنده است؛ ترتیب، معنا دارد:

| # | hostname | surface | نتیجهٔ رندر |
|---|---|---|---|
| 1 | `sa.zaraasan.ir` | `superadmin` | پنل سوپرادمین (نیاز به نقش) |
| 2 | `app.zaraasan.ir` | `platform-app` | ورود/پنلِ تننت کاربر، بدون منوی سوپرادمین |
| 3 | `zaraasan.ir`, `www.zaraasan.ir` | `landing` | لندینگ زرآسان (استاتیک — nginx هرگز SPA را نمی‌رساند) |
| 4 | `app.talaana.ir` | `tenant-app`, تننت `talana` | مارکت‌پلیس طلانا |
| 5 | `talaana.ir`, `www.talaana.ir` | `landing`, بدون تننت | لندینگ طلانا (اصلاح دیروز، ثابت می‌ماند) |
| 6 | `<slug>.talaana.ir` با slug معتبر | `tenant-app`, تننت `slug` | پنل/فروشگاه آن تننت |
| 7 | `*.localhost[:port]` | محلی | رفتارِ فعلیِ dev بدون تغییر |
| 8 | هر hostnameِ دیگر (دامنهٔ اختصاصی تننت) | `tenant-app` با ارجاع `{domain}` | resolve از بک‌اند؛ لندینگِ اختصاصی همان برشِ موکول است |

`{slug}.ir` و `app.{slug}.ir` در ردیف ۸ می‌نشینند و امروز فقط resolve-از-domain می‌شوند — یعنی افزودنشان بعداً این جدول را عوض نمی‌کند، فقط ردیف ۹ و ۱۰ می‌شود.

## ۶. اجزا

**۶.۱ `src/host.ts` (جدید).** ماژول خالص، بدون DOM و بدون fetch: `resolveHost(hostname, port?) → { surface, brand, tenantRef }` که `tenantRef` یا `{slug}` است یا `{domain}` یا `null`؛ به‌علاوه `SUPERADMIN_ORIGIN = 'https://sa.zaraasan.ir'`. تنها consumer های این تابع، سه نقطهٔ §۱ و `tenant.tsx` هستند. `tenant.tsx` کارِ *ساختن* URL را نگه می‌دارد (`getTenantUrl`) و `host.ts` کارِ *تفسیر* hostname را — امروز هر دو در یک فایل‌اند و دلیلِ سوم شدنِ باگ‌های این ناحیه همان قاطی‌بودنِ این دو وظیفه است.

**۶.۲ گیتِ سمت کاربر.** در `App.tsx`: `goToAdmin()` دیگر هرگز `#/superadmin` نمی‌نویسد مگر surface == `superadmin`؛ روی `platform-app` به `#/tenant/dashboard` می‌رود و لینکِ «پنل پلتفرم» به `sa.zaraasan.ir` می‌گیرد. در `AdminPanel.tsx`: جایی که `prefix` از نقش ساخته می‌شود، اگر host اجازه ندارد، رندرِ سوپرادمین انجام نمی‌شود و `window.location.href = SUPERADMIN_ORIGIN + '#/superadmin/<همان صفحه>'` می‌خورد. این بازدارندگیِ UX است؛ مرزِ واقعیِ امنیتی همان بررسیِ نقش در middleware/API است که دست‌نخورده می‌ماند و در تستِ زنده صریح چک می‌شود.

**۶.۳ پچ nginx.** چهار بلاک `server_name` دقیق — ۸۰ و ۴۴۳ برای هر کدام از `app.zaraasan.ir` و `sa.zaraasan.ir` — با الگوی `talana-frontend.conf` و `root /home/talana/www/talana-frontend/dist`، گواهی `zaraasan-wildcard` و لاگ‌های جدا (`zaraasan-platform-access.log` / `zaraasan-platform-error.log`). چون nginx تطابقِ دقیق را بر wildcard ترجیح می‌دهد، بلاکِ ۳۰۱ برای بقیهٔ `*.zaraasan.ir` بدون جابه‌جایی اثرش را از دست می‌دهد — خودِ کامنتِ فایل این حرکت را پیش‌بینی کرده بود. `000-catchall` و هیچ `talana*` فایلی دست نمی‌خورد. فایلِ جدید در ریپوی استقرار (`D:/talana/deploy`، نه `talana-frontend`) نوشته می‌شود: `deploy/nginx/zaraasan-platform.conf`، و `deploy/nginx/zaraasan.conf` با نسخهٔ زندهٔ `/etc/nginx/sites-available/zaraasan` هم‌راستا می‌شود (چک‌اوتِ `/home/talana/www/talana-deploy/nginx/` این فایل‌ها را ندارد — §۲.۶).

**۶.۴ اصلاح محیط build.** `.env.production`ِ روی سرور به `VITE_BASE_DOMAIN=talaana.ir` برمی‌گردد و یک `VITE_PLATFORM_DOMAIN=zaraasan.ir` می‌گیرد؛ این مقدار در ریپو هم مستند می‌شود تا rebuildِ مستند، اصلاح دیروز را وارونه نکند. فایل‌های `.env*` track نمی‌شوند؛ پس قرارداد در `docs/tenant-isolation.md` و `.env.production.example` نوشته می‌شود.

## ۷. موارد مرزی (رفتار تعریف‌شده)

| حالت | رفتار |
|---|---|
| سوپرادمین روی `app.zaraasan.ir` | پنلِ تننتش (talana) + لینک به `sa.`؛ منوی سوپرادمین رندر نمی‌شود |
| کاربر تننت روی `sa.zaraasan.ir` | صفحهٔ «این پنل دسترسی شما نیست» + دکمهٔ بازگشت به `app.zaraasan.ir`؛ ریدیرکت خودکارِ بی‌پایان نمی‌شود |
| ناشناس روی `sa.zaraasan.ir` | لاگین همان‌جا، بعد از موفقیت `#/superadmin/dashboard` |
| ناشناس روی `app.zaraasan.ir` | لاگین همان‌جا، بعد از موفقیت `#/tenant/dashboard` |
| کاربری که `permissions.tenant` اش null است | حالت «تننتی نیست» با متنِ صریح، نه صفحهٔ خالی (این همان محدودیتِ §۲.۵ است؛ رفعش endpoint عضویت است) |
| impersonation از پنل پلتفرم | همان رفتارِ امروز، ولی token و تننت impersonated فقط روی `sa.` معنا دارند |

## ۸. تست

۱. **قراردادِ میزبان** — جدول §۵ به‌صورت assertion در `e2e/tenant-routing.spec.ts` (الگوی موجود: import ماژول با `page.evaluate`). ریپو `vitest` ندارد، پس همین Playwright تنها بسترِ تستِ خالص است.
۲. **Mutation test** — هر قاعده را یکی‌ یکی می‌شکنم (ردیف ۱ را جابه‌جا، `app.` را حذف، گیتِ §۶.۲ را neutral) و نشان می‌دهم تست قرمز می‌شود؛ بدون این، سبز بودنِ تست معنی ندارد.
۳. **پروبِ زنده** — گسترشِ `D:/talana/.qa-hosts-probe.cjs` به ماتریس ۸ میزبانی (`zaraasan.ir`, `app.`, `sa.`, `talaana.ir`, `app.talaana.ir`, `pars-gold.talaana.ir`, `junk.zaraasan.ir`, `talaana.ir/#/superadmin`) با اسکرین‌شات و JSON؛ انتظار: چهار میزبانِ درستِ امروز بدون تغییر، دو سطحِ تازه باز، `junk.` همچنان ۳۰۱، و سوپرادمین روی `talaana.ir` بسته.
۴. `tsc --noEmit` (اسکریپت `lint`) و اجرای e2e با `--workers=1` — flakeِ شناخته‌شدهٔ `fullyParallel` در این spec از قبل وجود دارد و نباید به پای این تغییر نوشته شود.

## ۹. استقرار و بازگشت

ترتیب مهم است چون گیتِ سوپرادمین می‌تواند دسترسی مالک را ببندد:

1. کد + تست‌ها روی شاخه، `tsc` و e2e سبز.
2. build روی لپ‌تاپ (هرگز روی سرور)، آپلود `dist` به مسیر staging، cutover اتمیک `index.html` با بکاپ زمان‌دار (همان روشِ `dist.bak-<ts>` دیروز). توجه به دامنهٔ اثر: چون همهٔ میزبان‌های SPA یک `dist` را سرو می‌کنند، همین cutover روی `talaana.ir` و `app.talaana.ir` و `<slug>.talaana.ir` هم می‌نشیند — پس معیار ۵ در §۱۱ بلافاصله بعد از همین مرحله چک می‌شود، نه آخرِ کار.
3. nginx: بکاپ از فایل‌های درگیر، افزودن بلاک‌های دقیق، `nginx -t` سبز، reload، **صبر برای drain شدن workerها**، سپس تشخیص final vhost از لاگ با `$host` — نه از پاسخ (درسِ قبلی: پاسخِ درست می‌تواند از worker قدیمی باشد).
4. پروبِ زندهٔ §۸.۳ + یک لاگین واقعیِ سوپرادمین روی `sa.zaraasan.ir` که **مالک انجام می‌دهد** (اعتبارنامهٔ prod در اختیار من نیست؛ تا آن لحظه اثباتِ کاملِ جریان احراز هویت باز است).
5. هم‌راستایی `deploy/nginx` و `.env.production` سرور.

**بازگشت:** `cp -a dist.bak-<ts>/. dist/` (بازگرداندن `index.html` و assets با هم) و `rm /etc/nginx/sites-enabled/zaraasan-platform && nginx -t && systemctl reload nginx` — چون بلاک‌ها افزوده‌اند، حذف‌شان دقیقاً به حالتِ امروز برمی‌گرداند (۳۰۱). گیتِ سمت کاربر با همان بازگردانی `dist` برمی‌گردد؛ هیچ داده یا migration ای برای بازگشت لازم نیست.

## ۱۰. خارج از دامنه (به‌صراحت)

- صفحهٔ لندینگِ هر تننت (`{slug}.ir`): هم طراحی، هم DNS/گواهی هر برند.
- `app.{slug}.ir` برای فروشگاه‌ها با دامنهٔ اختصاصی.
- endpoint «تننت‌های من» و سوییچرِ چندنقشه‌ای (تا نیست، §۲.۵ محدودیتِ واقعیِ `app.zaraasan.ir` است).
- ادغام `fix/apex-landing-app-split` در `main`، صفحهٔ ۴۰۴ برندد، mailbox تماس، حذف `LandingPage.tsx` مرده، تکلیف copy «نسخهٔ صنف طلا از سامانهٔ طلانا» در لندینگ زرآسان، و repo شدن `zarasan-landing`.

## ۱۱. معیارهای پذیرش

۱. `https://app.zaraasan.ir/` یک فرم لاگین سرو می‌کند و بعد از لاگین، پنلِ تننتِ همان کاربر (نه سوپرادمین).
۲. `https://sa.zaraasan.ir/#/superadmin/tenants` برای حسابِ سوپرادمین رندر می‌شود و لیست تننت‌ها را از API می‌گیرد.
۳. `https://talaana.ir/#/superadmin/tenants` و `https://pars-gold.talaana.ir/#/superadmin/...` رندر **نمی‌شوند**؛ کاربر روی `sa.zaraasan.ir` با همان صفحه می‌نشیند.
۴. `junk.zaraasan.ir` همچنان ۳۰۱ به `https://zaraasan.ir/` است.
۵. چهار میزبانِ درستِ امروز (`zaraasan.ir`, `talaana.ir`, `app.talaana.ir`, `pars-gold.talaana.ir`) همان وضعیتِ HTTP و همان رندرِ دیروز را دارند (تطبیق با پروب §۸.۳ و اسکرین‌شات‌ها).
۶. جدول §۵ در e2e سبز است و هر شش شکستنِ mutation در §۸.۲ تستِ متناظرش را قرمز می‌کند.
۷. `nginx -t` سبز، لاگ‌های جدا برای بلاک جدید، و هیچ فایلِ `talana*` یا `000-catchall` تغییر نکرده (نشان داده با `git diff` ریپوی deploy و `md5sum` فایل‌های درگیر).

## ۱۲. اجرای این طرح (ثبت‌شده 2026-11-17)

تاریخِ انتشار از `TS=20261117195511` در گام ۲ تسک ۷ گرفته شده است، نه تاریخِ نوشتنِ طرح. هر خانه یا اندازه‌گیری‌شده و فایلِ اثباتش نام دارد، یا «باز» است با دلیل.

| معیار | نتیجه | اثبات |
|---|---|---|
| ۱ app.zaraasan.ir لاگین می‌دهد | نیمهٔ اول: عبور · نیمهٔ دوم: باز | نیمهٔ اول: دو ردیفِ `zaraasan app surface` و `zaraasan app login` در `D:/talana/.qa-hosts.json` — finalUrl روی `https://app.zaraasan.ir/#/login` با `loginFormVisible: true`؛ اسکرین‌شات `D:/talana/.qa-hosts/zaraasan-app-login.png`. نیمهٔ دوم (پنلِ تننتِ همان کاربر بعد از لاگین) باز است: پروبِ زنده به‌صورت ناشناس اجرا می‌شود و گام ۶ تسک ۷ آن را به لاگینِ خودِ مالک سپرده، چون اعتبارنامهٔ prod در اختیار مجری نیست. |
| ۲ sa.zaraasan.ir سوپرادمین | باز | رندر شدنِ `#/superadmin/tenants` برای یک حسابِ سوپرادمین و گرفتنِ لیست تننت‌ها از API بدون لاگین واقعی قابل اندازه‌گیری نیست؛ ردیف‌های بی‌لاگین فقط ثابت می‌کنند مسیر به `https://sa.zaraasan.ir/#/login` می‌نشیند (`sa surface` در `D:/talana/.qa-hosts.json`). تکلیفِ لاگین طبق گام ۶ تسک ۷ با مالک است. |
| ۳ بستن سوپرادمین روی بقیه | عبور | چهار ردیف در `D:/talana/.qa-hosts.json`: `sa surface`، `gate from landing`، `gate from store`، `gate from marketplace app` — همه با finalUrl دقیقاً `https://sa.zaraasan.ir/#/login` و `platformPanel: false`. ردیفِ چهارمِ همان چهار ردیف سوپرادمین (دهمین ردیفِ ماتریس؛ میزبان مارکت‌پلیس) زیر harness اصلی timeout خورد و سه بار جدا دوباره اندازه‌گیری شد (`harness:` همان ردیف، دو تلاش در `D:/talana/.qa-gate-rerun.json` + `.qa-gate-rerun.cjs`، تلاشِ سوم با فیلدِ `destinationsAgree: true` داخل خود ماتریس). |
| ۴ junk.zaraasan.ir ۳۰۱ | عبور | `D:/talana/.qa-status.txt` بخشِ `--- junk.zaraasan.ir headers ---`: `HTTP/1.1 301 Moved Permanently` و `Location: https://zaraasan.ir/`؛ ردیفِ `junk subdomain` در ماتریس هم finalUrl اش `https://zaraasan.ir/` است. |
| ۵ چهار میزبان دیروز (baseline = captureهای 2026-11-16) | عبور با قید | `talaana.ir`، `app.talaana.ir`، `satora.talaana.ir` و `talaana.ir/experience` روی فیلدهای مشترکِ دو capture برابرند (`D:/talana/.qa-hosts-20261116.json` در برابر `D:/talana/.qa-hosts.json` و `D:/talana/.qa-unchanged-hosts.json` و `D:/talana/.qa-experience.json`) — نه کلید‌به‌کلید: ردیف‌های baseline مربوط به 2026-11-16 پیش از آن نوشته شده بودند که پروب فیلدهای `platformPanel` و `tenantNotFoundLeak` را بگیرد، پس آن دو فیلد در captureهای دیروز وجود ندارد. وضعیتِ HTTP همگی ۲۰۰ در `D:/talana/.qa-status.txt`. سه قید: (۱) `zaraasan.ir` در ماتریسِ دیروز نبود، پس با خانوادهٔ پروبِ دیگری تطبیق خورده — `D:/talana/zarasan-landing/qa/live.json` با مُهرِ 2026-11-15T14:36Z، یعنی رکوردِ دو روزهٔ پروژهٔ دیگر، نه ماتریسِ دیروز؛ (۲) `pars-gold.talaana.ir` فقط یک baseline از نوعِ مقصدِ کلیک‌شده دارد (`D:/talana/.qa-cta-20261116.json`، فیلدِ `passwordInput`)، نه بارگذاریِ مستقیم — یعنی این میزبان «partially evidenced» است، نه identical؛ (۳) نیمهٔ «اسکرین‌شات»ِ همین معیار برای همان میزبان دیگر قابل انجام نیست: در دورِ اصلاحِ تسک ۷ جریانِ CTA دوباره اجرا شد و دو اسکرین‌شاتِ baseline (`D:/talana/.qa-hosts/cta-sample-store.png` و `cta-enter-marketplace.png`، هر دو با mtime 2026-11-17 23:30) بازنویسی شدند، پس تطبیقِ تصویری با وضعیتِ پیش از انتشار برای `pars-gold.talaana.ir` برای همیشه ناممکن است و فقط baselineِ JSON مانده است. |
| ۶ قرارداد + mutation | عبور با قید | اجرای تازه با کارگرِ اجباریِ ۱: `npx playwright test e2e/host-surface.spec.ts e2e/tenant-routing.spec.ts --workers=1` → `6 passed (29.0s)`، خروجی کامل در `D:/talana/qa-acceptance-20261117/qa-acceptance-playwright.txt` به‌همراه بازاجرای مستقلِ کنترلر (`6 passed (28.2s)`). تاریخِ این capture روزِ بعد از مُهرِ انتشار است (2026-11-18 در برابر `TS=20261117195511`) و همان اجراست، پس تضادی نیست. قیدِ mutation: از دوازده ردیفِ شکستنِ ماتریسِ Step ۶ طرح (§۸.۲ خود نثر است، نه جدول؛ §۱۱.۶ شش شکستن می‌خواهد و دوازده پروب اجرا شده — سوپرسِت است، نه قراردادِ دیگر؛ جدول در `docs/host-surface-model-plan.md:362-379` و ثبتِ تسک ۱ در `.superpowers/sdd/host-surface-model-plan/task-1-report.md:56-76`)، **ردیف‌های ۱–۷ و ۹–۱۲ (یازده از دوازده) قرمزِ مشاهده‌شده با خروجیِ ثبت‌شده‌اند**؛ ردیفِ ۸ هیچ تستِ محلیِ کشتنی ندارد — حکمِ اولِ کنترلر آن را به تسک ۴ منتقل کرد و بعد **پس گرفت**، چون `resolveHost` روی localhost هرگز `superadmin` نمی‌دهد (فقط `landing`/`tenant-app`)، پس هیچ تستِ محلی نمی‌تواند صفحهٔ دسترسی‌ممنوع را رندر کند و سوئیت اصلاً `AdminPanel` را mount نمی‌کند (پوششِ مسیرِ ریدایرکت از آن زمان با `e2e/superadmin-gate.spec.ts` اضافه شده — به «موارد باز» نگاه کنید). مشاهدهٔ ردیفِ ۸ فقط با پروبِ زنده روی `sa.zaraasan.ir` با حسابی غیرِ پلتفرمی ممکن است، یعنی نیازمندِ اعتبارنامهٔ مالک، پس «باز». |
| ۷ nginx بدون تغییر ناخواسته | عبور | `diff`ِ baseline در برابر after = دقیقاً یک خطِ افزوده: `11a12 > 648b9231b24b80ed0ded58c4288dec15  zaraasan-platform`؛ هیچ هشِ تغییرنیافته و هیچ خطِ حذف‌شده‌ای نیست. capture اول در `/tmp` گرفته شد و چهار فایل حالا به‌صورت پایدار در `D:/talana/qa-acceptance-20261117/` نگه داشته شده‌اند (`qa-nginx-baseline.txt`، `qa-nginx-after.txt`، `qa-nginx-T.txt`، `qa-platform-log.txt`) و همان diff از همان‌جا بازتأیید شده است؛ خروجی هم در §Task ۷ِ `.superpowers/sdd/host-surface-model-plan/progress.md` ثبت شده. توجه: baselineِ روزِ انتشار **یازده** vhost فعال داشت، نه نه‌تایی که طرح در 2026-11-16 شمرده بود — `beezino` و `foodlab` افزوده‌های پروژه‌های دیگر روی همین باکس‌اند و هیچ‌کدام دست نخوردند. `nginx -T` در `qa-nginx-T.txt` و لاگِ جدا در `qa-platform-log.txt` (همان دایرکتوری). |

### موارد باز

- شش مشاهدهٔ نیازمندِ اعتبارنامهٔ مالک: لاگین روی `sa.zaraasan.ir` و دیدنِ پنلِ پلتفرم با «فروشگاه‌ها»؛ لاگین روی `app.zaraasan.ir` و دیدنِ پنلِ *تننت* همان کاربر (§۱۱.۱ نیمهٔ دوم)؛ رندر شدنِ لیست تننت‌ها برای حسابِ سوپرادمین (§۱۱.۲)؛ دیدنِ ردیفِ ۸ِ شکستنِ §۸.۲ (لینکِ صفحهٔ دسترسی‌ممنوع هاردکد شود، بی‌آنکه از `PLATFORM_APP_ORIGIN` بیاید) که محلی قابل کشتن نیست و فقط با همان پروبِ زنده اندازه‌گیری شدنی است؛ و دو موردی که از تسک ۴ بدهکار مانده — impersonate کردنِ تننتِ مارکت‌پلیس روی `sa.` (ناوبریِ تننتی + «داشبورد بازارچه»، بدون shop switcher) و نقشِ پلتفرم روی میزبانِ فروشگاه (فیلترِ همه‌فروشگاه‌ها نباشد، اعلانِ محدودیتِ AI باشد).
- مشاهدهٔ برندینگ: `app.zaraasan.ir` و `sa.zaraasan.ir` هر دو h1/title «طلانا» را رندر می‌کنند، حال آنکه برندِ سطحِ پلتفرم زرآسان است؛ هیچ معیاری از §۱۱ این را تست نمی‌کند و تصمیمِ مالک است.
- ریسکِ بازِ خودِ طرح (§Open risks): ورودِ با نقشِ پلتفرم روی میزبانِ بی‌تننت هرگز در مرورگر تأیید نشده — پروبِ زنده عمداً ناشناس است.
- `VITE_APP_NAME` توسط هیچ کدی خوانده نمی‌شود، ولی `.env.production.example` آن را جزو «کل قرارداد» معرفی می‌کند.
- پوششِ گیتِ App: تست مرورگریِ تازه (`e2e/superadmin-gate.spec.ts`) خودِ مسیرِ App را با aliasِ `talaana.ir` روی `127.0.0.1` می‌پیماید و دو شکستنِ جدا اندازه‌گیری شده است: (۱) خنثی‌کردنِ فراخوانیِ `superadminRedirectTarget` در `applyHostRouting` (`src/App.tsx`) نیمهٔ مثبت را در سطرِ `toHaveURL` قرمز می‌کند و پیامِ خطا نشان می‌دهد سندِ SPA واقعاً لود شده (`<html lang="fa" dir="rtl">`) و فقط ریدایرکت رخ نداده؛ (۲) حذفِ شاخهٔ `superadminAllowed` از `superadminRedirectTarget` در `src/host.ts` — یعنی رفتارِ «همیشه ریدایرکت» — نیمهٔ منفی را قرمز می‌کند، چون صفحه روی `https://sa.zaraasan.ir/#/superadmin/tenants` می‌نشیند به‌جای `#/login`. خروجیِ هر دو شکستن در `D:/talana/qa-acceptance-20261117/mutant-probe-20261119/` (اسکریپتِ همان‌جا: `.qa-mutation-probe.cjs`؛ با درختِ تمیز اجرا می‌شود و `src/` را با `git checkout` برمی‌گرداند). آنچه این تست محافظت **نمی‌کند**: دو صفحهٔ پلتفرمیِ «این نشانی فقط برای مدیران پلتفرم زرآسان است» و «فروشگاهی برای این حساب پیدا نشد» و لینکِ `PLATFORM_APP_ORIGIN` که رندر می‌کنند — هیچ تستِ محلی `AdminPanel` را mount نمی‌کند (با localhost گیت هرگز ریدایرکت نمی‌دهد)، و اندازه‌گیریِ M2 کنترلر پیش از این تست نشان داد خنثی‌سازیِ گیت سوئیتِ helper-call را در `6 passed` نگه می‌داشت؛ تنها شاهدشان چهار ردیفِ زنده در `D:/talana/.qa-hosts.json` است.
- سوئیتِ کاملِ `e2e/` روی این شاخه سبز نیست، و هیچ‌کدام از ۲۲ قرمزی‌اش مالِ این شاخه نیست: `npx playwright test --workers=1` روی `364e368` → `22 failed / 17 passed (10.1m)`. پایه (`a249bea`) را با همان فرمان اندازه‌گیری کردم: در سه اسپکی که در پایه وجود دارند (`contracts`، `login`، `tenant-routing` — خودِ `host-surface.spec.ts` در پایه اصلاً فایل نیست و مالِ همین شاخه است) نتیجه `6 failed / 14 passed` بود، **دقیقاً همان شش ردیف با همان سطرِ نام‌ها** (پنج ردیفِ `contracts.spec.ts:237-284` و `login.spec.ts:103`)، و `e2e/tax-proof` با `--timeout=5000` در هر دو سو `16 failed` با همان امضا (۱۵× انتظارِ دکمهٔ «مالی» و ۱× «محصولات» در `aside`). سوئیتِ پایه ۳۹ تست ندارد بلکه ۳۶ تا دارد (`contracts` ۸ + `login` ۸ + `tenant-routing` ۴ + `tax` ۱۶)، چون این شاخه سه تست افزوده (`host-surface` دوتا، `superadmin-gate` یکی) و هر سه سبزاند؛ پس `17 = 14 + 3`. علتِ قرمزیِ tax-proof ثبتِ دقیقِ «محیط/بک‌اند لوکال» نیست، چون علتش را جدا اندازه نگرفتم — آنچه اندازه گرفته شد فقط برابریِ کاملِ مجموعهٔ قرمزها با پایه است. captures: `D:/talana/qa-acceptance-20261117/finishing-fullsuite-20261119.txt` (سرِ شاخه) و `finishing-scope-BASE-a249bea.txt` (پایه). معیار ۶ (قرارداد + mutation) پوششِ خودِ این شاخه را به سه اسپکِ نام‌برده (`host-surface`، `tenant-routing`، `superadmin-gate`) محدود می‌کند که با هم `7 passed` می‌شوند.
- واگراییِ به‌میراث‌رسیدهٔ resolver: برچسب‌های `api.`/`www.`/`admin.`/`mail.` روی دامنهٔ *اختصاصیِ تننت* به `landing` می‌رسند، خلافِ متنِ ظاهریِ ردیف ۸ §۵؛ در `a249bea` بایت‌به‌بایت یکسان اندازه‌گیری شد، پس رفتارِ حفظ‌شده است نه رگرسیونِ این شاخه، و تصمیمش با مالک است (فقط اگر تننتی SPA را روی چنین برچسبی از دامنهٔ خودش سرو کند اثر می‌کند).
- ورودی‌های build بدون assertion: `VITE_PLATFORM_DOMAIN` (و خواهرانش) از `.env.production` به bundle می‌رسند، ولی سرورِ تست با `envFile: false` اجرا می‌شود؛ پس سوئیت *مقادیرِ پیش‌فرض* را اثبات می‌کند — مقدارِ غلط یعنی `SUPERADMIN_ORIGIN` به میزبانِ اشتباه با تست‌های سبز. mitigation موجود همان پروبِ زندهٔ §۱۲ (ردیفِ معیار ۳) است.
- متنِ اعلانِ `AiSettings` («فقط سوپرادمین می‌تواند به تنظیمات AI دسترسی داشته باشد») حالا دقیق نیست، چون یک سوپرادمین هم می‌تواند به‌واسطهٔ میزبان رد شود. اصلاحش یعنی ساختنِ copy فارسیِ کاربری که طرح مجازش نکرده؛ به‌عنوان یک تصمیمِ تک‌خطیِ مالک پارک شده (Minor) و اینجا ثبت شد تا بی‌صدا ارسال نشود.
