# Cafe POS — Full-Stack Point of Sale System

A production-ready, real-time Point of Sale (POS) system designed for cafes and restaurants. Built with Node.js, Express, Prisma ORM, PostgreSQL, React, Vite, and Socket.IO for live, bidirectional communication across terminals and displays.

---

## Table of Contents

1. [Overview](#overview)
2. [Screenshots](#screenshots)
   - [Authentication](#authentication)
   - [Employee — POS Terminal Flow](#employee--pos-terminal-flow)
   - [Kitchen Display System](#kitchen-display-system)
   - [Admin — Backend Panel](#admin--backend-panel)
3. [Feature Reference](#feature-reference)
4. [Demo Credentials](#demo-credentials)
5. [Quick Demo Walkthrough](#quick-demo-walkthrough)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Local Development Setup](#local-development-setup)
9. [Production Deployment Guide](#production-deployment-guide)
10. [Security Architecture](#security-architecture)
11. [API Endpoints Reference](#api-endpoints-reference)

---

## Overview

Cafe POS is designed as a multi-role, real-time system where:

- **Employees** use the POS terminal to take orders, manage tables, apply promotions, and process payments.
- **Kitchen Staff** use the Kitchen Display System (KDS) to see incoming orders in real time and update ticket statuses without any page refresh.
- **Administrators** use the backend panel to manage products, categories, tables, coupons, promotions, payment methods, users, and generate analytical reports.

All roles share a common authentication layer with JWT access and refresh token rotation. Role-based guards control page access automatically.

---

## Screenshots

### Authentication

**Login Portal**

![Login Portal](screenshots/01_login.png)

The central authentication page for all roles. Employees are redirected to the POS terminal; admins are redirected to the backend dashboard.

---

**Signup / Registration**

![Signup Page](screenshots/02_signup.png)

New account registration interface. Accounts are created with the EMPLOYEE role by default; the ADMIN role is assigned manually in the Users management panel.

---

### Employee — POS Terminal Flow

**Step 1: Table / Floor Selection**

![Table Selection](screenshots/03_table_selection.png)

On login, employees are presented with a live floor map. Table occupancy status is updated in real time via Socket.IO. Employees select an available table to begin a new order session.

---

**Step 2: POS Terminal — Empty Cart**

![POS Terminal - Empty](screenshots/04_pos_empty.png)

The core POS interface. The left side shows a product grid organized by category tabs with color-coded labels. The right side shows the live order cart tied to the selected table.

---

**Step 3: POS Terminal — Active Cart**

![POS Terminal - Active Cart](screenshots/05_pos_with_cart.png)

Items are added to the cart by clicking product cards. Quantities can be adjusted inline. The cart automatically evaluates and applies any eligible promotional rules in real time (e.g., 5% discount for orders above a threshold).

---

**Step 4: Coupon Code Applied**

![POS Terminal - Coupon Applied](screenshots/06_pos_coupon.png)

The coupon entry field validates codes against the database. When a valid code is entered (e.g., `WELCOME20`), the discount is stacked on top of any auto-applied promotions, and the order summary reflects the updated total.

---

**Step 5: Order Sent to Kitchen**

![Order Sent to Kitchen](screenshots/07_kitchen_sent.png)

Clicking the "Kitchen" button transmits the order via Socket.IO to the KDS instantly. The order status updates to "Cooking" on the POS and the ticket appears on all connected kitchen displays without any page refresh.

---

**Step 6: Payment / Checkout Modal**

![Payment Modal](screenshots/08_payment_modal.png)

The checkout modal supports three payment methods:
- **Cash**: Accepts tender amount and displays change due.
- **Card**: Standard card payment confirmation flow.
- **UPI**: Generates a QR code from the configured UPI handle for cashless payments.

After payment confirmation, a receipt is generated with options to Print, Email, or start a New Order.

---

### Kitchen Display System

**KDS — Incoming Orders (To Cook)**

![Kitchen Display - Incoming](screenshots/09_kitchen_display.png)

The KDS organizes tickets in a three-column Kanban board: **To Cook**, **Preparing**, and **Completed**. Each ticket shows the table number, order items, and a per-item completion checklist. Ticket borders change color based on age — green (< 10 min), yellow (10–15 min), red pulsing (> 15 min).

---

**KDS — Ticket in Preparing State**

![Kitchen Display - Preparing](screenshots/10_kitchen_preparing.png)

Clicking the status advancement button moves a ticket from "To Cook" to "Preparing". The POS terminal and admin dashboard reflect this status update in real time. Audio notifications play when new tickets arrive.

---

### Admin — Backend Panel

**Dashboard — Sales Overview**

![Admin Dashboard](screenshots/11_admin_dashboard.png)

The admin dashboard provides a live summary of today's sales sessions, revenue, and order counts. Key metrics are displayed as stat cards with trend indicators. Recharts-powered visualizations show revenue trends (line chart) and category distribution (donut chart).

---

**Products Management**

![Admin Products](screenshots/12_admin_products.png)

Full CRUD interface for managing menu items. Each product has a name, description, price, category, and availability toggle. Products are searchable and filterable by category. Inline editing supports quick updates.

---

**Categories Management**

![Admin Categories](screenshots/13_admin_categories.png)

Category management page for organizing the product menu. Each category has a name, color label (rendered as tabs on the POS terminal), and an active/inactive toggle. Reordering categories changes their display priority on the POS grid.

---

**Payment Methods**

![Admin Payment Methods](screenshots/14_admin_payment_methods.png)

Configure which payment options are available at checkout. For UPI, a QR code image or UPI handle can be uploaded and previewed. Payment methods can be enabled or disabled individually without affecting existing transaction records.

---

**Floor & Table Management**

![Admin Tables](screenshots/15_admin_tables.png)

Create and manage floors and tables. Each table has a name/number and belongs to a floor section. Tables appear on the employee's floor selection popup. Occupied tables are visually distinguished from available ones in real time.

---

**Coupons & Promotions**

![Admin Coupons](screenshots/16_admin_coupons.png)

Two-part discounting system:
- **Coupons**: Fixed or percentage discounts applied via a code entered by the employee at checkout.
- **Promotions**: Conditional rules (e.g., "apply 5% off for orders above Rs. 300") evaluated automatically when cart conditions are met.

Both systems stack on top of each other and are configurable with validity windows and usage limits.

---

**User Management**

![Admin Users](screenshots/17_admin_users.png)

View and manage all registered accounts. Admins can change user roles (ADMIN / EMPLOYEE), reset passwords, deactivate accounts, and create new users directly from this interface. The table shows each user's role, status, and registration date.

---

**Reports & Analytics**

![Admin Reports](screenshots/18_admin_reports.png)

The reports module provides:
- **Revenue Overview**: Line chart of daily/weekly revenue trends.
- **Category Breakdown**: Donut chart showing sales distribution by product category.
- **Session Logs**: Tabular list of completed order sessions with totals.
- **Export**: Download full session and revenue data as CSV or PDF for offline analysis.

---

## Feature Reference

### POS Terminal (Employee Role)
| Feature | Description |
|---|---|
| Floor map & table selection | Live floor plan with real-time occupancy status |
| Product grid | Color-coded category tabs, search, and quantity controls |
| Automatic promotions | Rules evaluated in real time based on cart contents |
| Coupon validation | Code-based discount system with stacking support |
| Customer assignment | Link orders to registered customer profiles |
| Kitchen routing | Socket.IO push to KDS on order confirmation |
| Cash payment | Tender entry with auto-calculated change |
| Card payment | Confirmation-based flow |
| UPI payment | Dynamic QR code generated from configured UPI ID |
| Receipt options | Print, email, or new order |

### Kitchen Display System (KDS)
| Feature | Description |
|---|---|
| Three-column Kanban | To Cook / Preparing / Completed workflow |
| Live ticket arrival | Socket.IO push; tickets appear without page refresh |
| Per-item checklist | Mark individual items as ready |
| Age-based color coding | Green / yellow / red border based on ticket duration |
| Urgent pulsing border | Animated border for overdue tickets (> 15 min) |
| Audio notification | Sound alert on new order arrival |

### Backend Administration (Admin Role)
| Module | Capabilities |
|---|---|
| Dashboard | Session stats, revenue charts, category breakdown |
| Products | Create, edit, delete, toggle availability |
| Categories | Create, edit, assign color, reorder |
| Payment Methods | Enable/disable, configure UPI QR |
| Tables & Floors | Create floors, add tables, manage occupancy |
| Coupons | Code-based percentage or flat discounts |
| Promotions | Conditional auto-apply rules |
| Users | Role management, account creation and deactivation |
| Reports | Revenue trends, category breakdown, CSV/PDF export |

---

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@cafe.com | Admin@123 | Full backend + POS terminal |
| Employee | rahul@cafe.com | Rahul@123 | POS terminal only |
| Employee | priya@cafe.com | Priya@123 | POS terminal only |

---

## Quick Demo Walkthrough

The following sequence demonstrates the complete order lifecycle from table selection to kitchen completion in under 2 minutes.

1. **Login as Employee**: Log in at `/login` with `rahul@cafe.com` / `Rahul@123`. The floor map popup appears automatically.
2. **Select a Table**: Click on an available table (e.g., T3) to start an order session.
3. **Build the Order**: Click product cards to add items — Cappuccino, Paneer Pasta, and a dessert. Observe the automatic 5% order promotion applied when the total crosses the threshold.
4. **Apply a Coupon**: Click the coupon field and enter `WELCOME20`. Click Apply. The 20% discount stacks on top of the auto-promotion.
5. **Send to Kitchen**: Click the Kitchen button. The order is transmitted instantly.
6. **Open the KDS**: In a second browser tab, open `/kitchen`. The new ticket appears immediately in the "To Cook" column.
7. **Advance the Ticket**: Click the state button on the ticket to move it to "Preparing".
8. **Process Payment**: Back in the POS terminal, click Charge, select UPI, and scan the generated QR code to complete the transaction.
9. **Check the Dashboard**: Log in as `admin@cafe.com` and open `/backend`. Revenue and session counts reflect the completed order.

---

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Backend runtime | Node.js + Express | 18+ |
| Real-time transport | Socket.IO | v4 |
| ORM | Prisma | v5 |
| Database | PostgreSQL | 14+ |
| Authentication | JWT (RS256 access + refresh) | — |
| Frontend framework | React + Vite | React 18 |
| Styling | Tailwind CSS | v3 |
| State management | Zustand | v4 |
| Data visualization | Recharts | v2 |
| QR code generation | qrcode.react | v3 |
| HTTP client | Axios | v1 |
| Notifications | react-hot-toast | v2 |

---

## Project Structure

```text
cafe-pos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Data model: User, Product, Category, Order, Table, Coupon, Promotion
│   │   └── seed.js                # Seeds admin account, demo products, categories, tables, and coupons
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification, role guards (ADMIN / EMPLOYEE)
│   │   │   └── validate.js        # Request body validation using Zod
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /login, /logout, /refresh
│   │   │   ├── users.js           # CRUD for user accounts
│   │   │   ├── products.js        # CRUD for menu items
│   │   │   ├── categories.js      # CRUD for product categories
│   │   │   ├── tables.js          # Floor and table management
│   │   │   ├── orders.js          # Order creation, status transitions
│   │   │   ├── coupons.js         # Coupon creation and validation
│   │   │   ├── promotions.js      # Conditional promotion rules
│   │   │   ├── paymentMethods.js  # Payment option configuration
│   │   │   ├── payments.js        # Payment recording and receipt generation
│   │   │   ├── reports.js         # Revenue and session aggregations
│   │   │   ├── customers.js       # Customer profile management
│   │   │   ├── sessions.js        # POS session lifecycle
│   │   │   └── kitchen.js         # KDS status transitions
│   │   └── utils/
│   │       └── promotionEngine.js # Evaluates cart against active promotion rules
│   ├── server.js                  # Express app, Socket.IO setup, route mounting
│   └── render.yaml                # Render.com deployment configuration
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js          # Axios instance with base URL, auth headers, refresh interceptor
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── BackendLayout.jsx  # Admin sidebar, navigation, logout
    │   │   ├── pos/
    │   │   │   ├── ProductGrid.jsx
    │   │   │   ├── CartPanel.jsx
    │   │   │   ├── FloorPopup.jsx
    │   │   │   ├── CheckoutModal.jsx
    │   │   │   └── ReceiptModal.jsx
    │   │   └── ui/               # Shared UI primitives (Badge, Modal, Spinner)
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── pos/
    │   │   │   └── PosTerminal.jsx
    │   │   ├── kitchen/
    │   │   │   └── KitchenDisplay.jsx
    │   │   └── backend/
    │   │       ├── Dashboard.jsx
    │   │       ├── Products.jsx
    │   │       ├── Categories.jsx
    │   │       ├── PaymentMethods.jsx
    │   │       ├── Tables.jsx
    │   │       ├── Coupons.jsx
    │   │       ├── Users.jsx
    │   │       └── Reports.jsx
    │   ├── store/
    │   │   └── authStore.js       # Zustand store: user session, login/logout actions
    │   └── App.jsx                # Route definitions, AdminGuard, AuthGuard, GuestGuard
    └── vercel.json                # Vercel SPA routing config (rewrites all paths to index.html)
```

---

## Local Development Setup

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 14+ (local instance or [Supabase](https://supabase.com) free tier)
- npm v9+

---

### 1. Clone the Repository

```bash
git clone https://github.com/DEXTERPIRO/Odoo-Cafe-POS.git
cd Odoo-Cafe-POS/cafe-pos
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cafe_pos"
JWT_SECRET="your-32-char-access-secret"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
PORT=5000
```

Run database migrations and seed default data:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start the backend server:

```bash
node server.js
# Server runs on http://localhost:5000
```

---

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
```

Create a frontend environment file:

```bash
# Create .env.local
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

### 4. Access the Application

| URL | Description |
|---|---|
| `http://localhost:5173/login` | Login page |
| `http://localhost:5173/pos` | POS terminal (Employee) |
| `http://localhost:5173/kitchen` | Kitchen Display System |
| `http://localhost:5173/backend` | Admin panel |

---

## Production Deployment Guide

### Step 1 — Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Settings > Database** and copy the **Connection String (URI mode)**.
3. Replace `[YOUR-PASSWORD]` with your database password.
4. This becomes the value for `DATABASE_URL`.

---

### Step 2 — Backend (Render.com)

1. Push the repository to GitHub.
2. Go to [render.com](https://render.com) and create a **New Web Service**.
3. Connect the GitHub repo. Set the **Root Directory** to `cafe-pos/backend`.
4. Render detects `render.yaml` automatically. Confirm the build command (`npm install`) and start command (`node server.js`).
5. Add the following **Environment Variables** in the Render dashboard:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase connection string |
   | `JWT_SECRET` | Random 32+ character string |
   | `JWT_REFRESH_SECRET` | Random 32+ character string |
   | `FRONTEND_URL` | Vercel deployment URL (add after Step 3) |
   | `NODE_ENV` | `production` |

6. After the first successful deploy, run the seed script using the Render Shell:
   ```bash
   node prisma/seed.js
   ```

---

### Step 3 — Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and create a **New Project**.
2. Import the GitHub repository. Set the **Root Directory** to `cafe-pos/frontend`.
3. Add the following **Environment Variable**:
   - `VITE_API_URL` = `https://[your-render-service].onrender.com/api`
4. Deploy. Vercel uses `vercel.json` to handle SPA routing automatically.
5. Copy the Vercel deployment URL and update `FRONTEND_URL` in the Render dashboard (required for CORS).

---

## Security Architecture

| Mechanism | Implementation |
|---|---|
| Authentication | JWT access tokens (15-minute expiry) + refresh tokens (7-day expiry) stored in httpOnly cookies |
| Token rotation | On refresh, the previous refresh token is invalidated and a new pair is issued |
| Password hashing | Bcrypt with 12 salt rounds |
| HTTP headers | Helmet.js sets security headers (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | express-rate-limit applied to all `/api/auth/*` routes (max 10 requests per 15 minutes) |
| Input validation | Zod schemas validate all request bodies before they reach route handlers |
| Role-based access | Route-level guards enforce ADMIN vs. EMPLOYEE separation; frontend guards redirect unauthorized access |
| CORS policy | Configured to allow only the `FRONTEND_URL` origin in production |

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Returns access + refresh tokens |
| POST | `/api/auth/logout` | Required | Invalidates refresh token |
| POST | `/api/auth/refresh` | Refresh token | Issues new access + refresh tokens |

### Products
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/products` | Any | List all products |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |

### Orders & Sessions
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/orders` | Employee | Create a new order |
| GET | `/api/orders/kitchen` | Any | Get active kitchen orders |
| PUT | `/api/orders/:id/status` | Any | Update order status (triggers Socket.IO) |
| POST | `/api/sessions` | Employee | Open a POS session for a table |
| PUT | `/api/sessions/:id/close` | Employee | Close session after payment |

### Reports
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/reports/revenue` | Admin | Daily/weekly revenue aggregation |
| GET | `/api/reports/categories` | Admin | Sales volume by category |
| GET | `/api/reports/sessions` | Admin | Session log with totals |

*Additional endpoints exist for Categories, Tables, Coupons, Promotions, Payment Methods, Users, and Customers following the same REST pattern.*

---

*Cafe POS v1.0 — Built with Node.js, Prisma, React, and Socket.IO*
