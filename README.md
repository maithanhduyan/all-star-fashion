# All Star Fashion

> E-commerce thời trang — Deno Fresh + PostgreSQL + TailwindCSS

## One-Click Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/lAcp8_?referralCode=porbFd&utm_medium=integration&utm_source=template&utm_campaign=generic)

### Chỉ cần 3 bước:

1. **Click nút "Deploy on Railway"** phía trên
2. **Thêm PostgreSQL** — trong project Railway, click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. **Set environment variables** trong app service:

| Variable | Mô tả | Giá trị |
|---|---|---|
| `DATABASE_URL` | Reference từ PostgreSQL | `${{Postgres.DATABASE_URL}}` |
| `APP_ENV` | Môi trường | `production` |
| `SESSION_SECRET` | Secret cho session (64 ký tự) | _(tự generate)_ |
| `ADMIN_EMAIL` | Email admin | `admin@example.com` |
| `ADMIN_PASSWORD` | Password admin | _(strong password)_ |

Sau khi set xong, Railway tự động redeploy. App sẽ **tự chạy migration + seed data + khởi động server** — không cần làm gì thêm.

### Chi tiết auto-init flow:

```
start.ts
  ├─ Đợi DB sẵn sàng (retry 10 lần, mỗi lần 3s)
  ├─ Chạy migrations (db/migrations/*.sql)
  ├─ Seed data (categories, products, admin user)
  └─ Khởi động Fresh server
```

> Mọi lần restart/redeploy, migrations và seed đều **idempotent** (chỉ chạy những gì chưa áp dụng, dùng `ON CONFLICT DO NOTHING`).

### Deploy bằng Railway CLI (tùy chọn)

```bash
npm install -g @railway/cli
railway login
railway init
railway link
railway up    # Deploy xong, app tự init DB
```

---

## Local Development

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.
