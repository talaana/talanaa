# راهنمای اجرای محلی طلانا (Talana Local Dev Guide)

## پیش‌نیازها (Prerequisites)

| ابزار | نسخه | نصب |
|-------|------|------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | همراه Node.js |
| PHP | 8.1+ | [windows.php.net](https://windows.php.net) یا [Laravel Herd](https://herd.laravel.com) |
| Composer | 2+ | [getcomposer.org](https://getcomposer.org) |
| Git | هر نسخه | [git-scm.com](https://git-scm.com) |

## ساختار پروژه (Project Structure)

```
D:\talana\              → فرانت‌اند React (Vite + TypeScript + Tailwind)
D:\talana-backend\      → بک‌اند Laravel (API + SQLite)
```

---

## ۱. راه‌اندازی بک‌اند (Backend Setup)

```bash
# وارد پوشه بک‌اند شوید
cd D:\talana-backend

# نصب وابستگی‌های PHP
composer install

# کپی فایل محیطی (اگر وجود ندارد)
copy .env.example .env

# ساخت دیتابیس SQLite
touch database/database.sqlite

# اجرای migration و seeder
php artisan migrate --seed

# اجرای سرور توسعه
php artisan serve --port=8000
```

بک‌اند روی آدرس `http://localhost:8000` در دسترس خواهد بود.
برای تست، `http://localhost:8000/api/health` را در مرورگر باز کنید.

---

## ۲. راه‌اندازی فرانت‌اند (Frontend Setup)

```bash
# وارد پوشه فرانت‌اند شوید
cd D:\talana

# نصب وابستگی‌ها
npm install

# (اختیاری) فایل .env.local برای API Key بسازید
echo GEMINI_API_KEY=your_key_here > .env.local

# اجرای سرور توسعه روی پورت ۵۱۷۵
npm run dev -- --port=5175 --host=0.0.0.0
```

فرانت‌اند روی آدرس `http://localhost:5175` بالا می‌آید.

---

## ۳. اتصال فرانت‌اند به بک‌اند

فرانت‌اند به‌طور پیش‌فرض به `http://localhost:8000/api` متصل می‌شود.
برای تغییر آدرس بک‌اند، متغیر محیطی `VITE_API_URL` را تنظیم کنید:

```bash
# ویندوز (cmd)
set VITE_API_URL=http://localhost:8000/api && npm run dev -- --port=5175

# Git Bash / MSYS
VITE_API_URL=http://localhost:8000/api npm run dev -- --port=5175
```

---

## ۴. حساب‌های تست (Test Accounts)

اطلاعات ورود فروشگاه‌های تست:

| شماره موبایل | رمز عبور | نقش |
|-------------|---------|------|
| 09121000000 | password | فروشگاه ۱ |
| 09121000001 | password | فروشگاه ۲ |
| 09121000002 | password | فروشگاه ۳ |
| 09121000003 | password | فروشگاه ۴ |

---

## ۵. دستورات پرکاربرد (Useful Commands)

```bash
# فرانت‌اند
npm run dev              # اجرای سرور توسعه (پورت پیش‌فرض ۳۰۰۰)
npm run build            # بیلد production
npm run preview          # پیش‌نمایش بیلد production
npm run lint             # بررسی TypeScript

# بک‌اند
php artisan serve        # اجرای سرور API
php artisan migrate:fresh --seed   # بازنشانی کامل دیتابیس
php artisan route:list   # نمایش تمام route ها
```

---

## ۶. رفع مشکلات رایج (Troubleshooting)

### پورت ۵۱۷۵ در حال استفاده است

```bash
# یافتن پروسه استفاده‌کننده از پورت
netstat -ano | findstr :5175

# کشتن پروسه
taskkill /F /PID <PID>
```

### خطای CORS در فرانت‌اند

مطمئن شوید `VITE_API_URL` به‌درستی تنظیم شده و بک‌اند روی پورت ۸۰۰۰ اجراست.

### ارور npm install

پوشه `node_modules` را پاک کنید و دوباره نصب کنید:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## ۷. تکنولوژی‌ها (Tech Stack)

| لایه | تکنولوژی |
|------|----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Laravel (PHP), SQLite |
| State | Local Storage (auth token) |
| Font | Vazirmatn (فونت فارسی) |
| Icons | Lucide React |
| Animation | Motion (Framer Motion) |
| AI | Google Gemini API |
| Deploy | Vercel |

---

## ۸. اجرای سریع با یک دستور (Quick Start)

```bash
# ترمینال ۱: بک‌اند
cd D:\talana-backend && php artisan serve --port=8000

# ترمینال ۲: فرانت‌اند
cd D:\talana && npm run dev -- --port=5175 --host=0.0.0.0
```

سپس در مرورگر `http://localhost:5175` را باز کنید.
