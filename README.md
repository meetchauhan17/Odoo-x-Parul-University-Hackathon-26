# ☕ Cafe POS — Full-Stack Point of Sale System

A production-ready POS system built with **Node.js + Prisma + React + Socket.IO**.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@cafe.com | Admin@123 |
| Employee | rahul@cafe.com | Rahul@123 |
| Employee | priya@cafe.com | Priya@123 |

---

## 🌐 Live Demo

| Page | URL |
|---|---|
| Login | `[vercel-url]/login` |
| POS Terminal | `[vercel-url]/pos` |
| Kitchen Display | `[vercel-url]/kitchen` ← open in a separate tab! |
| Backend Admin | `[vercel-url]/backend/dashboard` |

> Replace `[vercel-url]` with your Vercel deployment URL after deploying.

---

## ⚡ 60-Second Demo Script

1. **Login** as `rahul@cafe.com` → Floor popup appears → Select **Table T3**
2. **Add items** → Cappuccino × 2 + Paneer Pasta → See **5% promo auto-apply** (order ≥ ₹300)
3. Apply coupon **WELCOME20** → See 20% discount stack
4. Click **👨‍🍳 Kitchen** → Order sent to kitchen
5. Open `[vercel-url]/kitchen` in another tab → **Ticket slides in live!** 🔥
6. On KDS: click **→ Preparing** → ticket moves column
7. Back in POS: click **💳 Charge** → Select **UPI** → Scan QR code
8. Check **Backend → Dashboard** → Revenue numbers updated in real-time

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + Socket.IO |
| ORM | Prisma v5 + PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Frontend | React + Vite + Tailwind CSS v3 |
| State | Zustand |
| Charts | Recharts |
| Real-time | Socket.IO |
| QR Codes | qrcode.react |

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Supabase free tier)

### Backend Setup
```bash
cd cafe-pos/backend
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET etc.
npx prisma migrate dev
npx prisma db seed
node server.js              # runs on :5000
```

### Frontend Setup
```bash
cd cafe-pos/frontend
npm install
npm run dev                 # runs on :5173
```

---

## ☁️ Deploy to Production (Free)

### Step 1 — Database (Supabase)
1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → copy **Connection String** (URI mode)
3. Replace `[YOUR-PASSWORD]` in the URI

### Step 2 — Backend (Render.com)
1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo → select `cafe-pos/backend` as root
4. Render auto-detects `render.yaml` — set env vars in dashboard:

| Var | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string |
| `JWT_SECRET` | any random 32+ char string |
| `JWT_REFRESH_SECRET` | any random 32+ char string |
| `FRONTEND_URL` | your Vercel URL (fill after step 3) |
| `NODE_ENV` | `production` |

5. After first deploy, run seed: **Render Dashboard → Shell → `node prisma/seed.js`**

### Step 3 — Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) → New Project → import repo
2. Set root directory to `cafe-pos/frontend`
3. Add Environment Variable:
   - `VITE_API_URL` = `https://[your-render-app].onrender.com/api`
4. Deploy!

---

## 📁 Project Structure

```
cafe-pos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── middleware/     # auth, validate
│   │   ├── routes/         # 14 route modules
│   │   └── utils/          # promotionEngine
│   ├── server.js
│   └── render.yaml
└── frontend/
    ├── src/
    │   ├── api/            # axios client (env-aware)
    │   ├── components/     # layout, ui, pos
    │   ├── pages/
    │   │   ├── backend/    # Dashboard, Products, Categories...
    │   │   ├── pos/        # PosTerminal, OrderView, FloorPopup...
    │   │   └── kitchen/    # KitchenDisplay
    │   └── store/          # Zustand authStore
    └── vercel.json
```

---

## 🎯 Features

### POS Terminal
- ✅ Floor → Table selection popup
- ✅ Product grid with category color tabs
- ✅ Cart with real-time promo auto-apply
- ✅ Coupon validation (WELCOME20, SAVE50, FLAT10)
- ✅ Customer assignment
- ✅ Send to Kitchen (Socket.IO live push)
- ✅ Payment: Cash (change calc), Card, UPI (QR code)
- ✅ Receipt: Print / Email / New Order

### Kitchen Display
- ✅ 3-column Kanban: To Cook → Preparing → Completed
- ✅ Live Socket.IO: new tickets slide in instantly
- ✅ Per-item DONE checkboxes
- ✅ Age-based color coding (🟢 < 10m · 🟡 10-15m · 🔴 > 15m)
- ✅ Urgent pulsing border for overdue tickets
- ✅ Audio notification on new order

### Backend Admin
- ✅ Dashboard with session stats
- ✅ Products / Categories CRUD
- ✅ Payment Methods (UPI QR preview)
- ✅ Floor & Table management
- ✅ Coupons & Promotions engine
- ✅ User management (ADMIN / EMPLOYEE)
- ✅ Reports with Recharts (line + donut) + CSV/PDF export

---

## 🔒 Security
- JWT access + refresh token rotation
- Bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting on auth endpoints
- Input validation middleware
- Role-based access (ADMIN / EMPLOYEE guards)

---

*Built with ❤️ — Cafe POS v1.0*
