# All Star Fashion

> E-commerce thời trang — Deno Fresh + PostgreSQL + TailwindCSS

## One-Click Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template?referralCode=allstarfashion)

> **Lưu ý**: Sau khi click nút trên, bạn cần:
> 1. Tạo tài khoản Railway (nếu chưa có)
> 2. Railway sẽ tự tạo project với 2 services: **App** + **PostgreSQL**
> 3. Thêm PostgreSQL add-on nếu chưa được tạo tự động
> 4. Set các environment variables bắt buộc (xem bên dưới)
> 5. Railway tự động build & deploy

### Environment Variables cần set trên Railway

| Variable | Mô tả | Ví dụ |
|---|---|---|
| `DATABASE_URL` | Railway tự inject khi add PostgreSQL | _(tự động)_ |
| `APP_ENV` | Môi trường chạy | `production` |
| `APP_URL` | URL public của app | `https://your-app.up.railway.app` |
| `SESSION_SECRET` | Secret cho session (64 ký tự) | _(random string)_ |
| `ADMIN_EMAIL` | Email admin mặc định | `admin@example.com` |
| `ADMIN_PASSWORD` | Password admin mặc định | _(strong password)_ |
| `FREE_SHIPPING_THRESHOLD` | Ngưỡng miễn phí ship (VNĐ) | `1000000` |
| `DEFAULT_SHIPPING_FEE` | Phí ship mặc định (VNĐ) | `30000` |

### Deploy thủ công qua Railway CLI

```bash
# Cài Railway CLI
npm install -g @railway/cli

# Login
railway login

# Khởi tạo project
railway init

# Thêm PostgreSQL
railway add --plugin postgresql

# Link repo
railway link

# Deploy
railway up

# Chạy migration
railway run deno run -A db/migrate.ts

# Seed data ban đầu
railway run deno run -A db/seed.ts
```

---

## Local Development

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.
