# Sri Mahadevaiyer Sweets – Order & Courier Management System
> **Traditional Pollachi Sweets since 1946** • Built for Diwali sweet-box dispatch and parcel logistics management.

---

## 🏛️ Project Overview
**Sri Mahadevaiyer Sweets** (Pollachi, Tamil Nadu, India) has been crafting traditional ghee sweets since 1946. This mobile-first web application is designed for shop staff and the owner to record customer orders, batch-dispatch packages through regional couriers (DTDC, ST Courier, Professional), track delivery timelines, send one-click customer WhatsApp delivery notices, and generate financial reports.

### 🌟 Key Features
- **Mobile-First & Responsive Layout**: Tailored for staff using mobile phones at shop counters during the festive Diwali rush.
- **Brand Aesthetic**: Authentic Maroon primary (`#7A1626`), Warm Cream background (`#FBF6EF`), clean card design, and dark mode support.
- **Bilingual Interface**: Seamless toggle between **English** and **Tamil (தமிழ்)** for menus, forms, and status badges.
- **Strict Role-Based Access Control**:
  - **Owner**: Full access to Dashboard, Add Order, Dispatch, Orders, Public Tracking, Reports (financial & city/courier breakdown), User Management, Activity Log, Settings, Delete Order, and Excel/PDF Exports.
  - **Staff**: Restricted to Dashboard, Add Order, Bulk Dispatch, Orders view/inline status updates, and WhatsApp/Track links. Staff cannot delete orders, view financial reports, manage users, or export data.
- **Bulk Dispatch**: Select multiple pending sweet orders with checkboxes and assign courier, dispatch date, and AWB numbers in a single atomic transaction.
- **Customer WhatsApp & Tracking**: One-click WhatsApp link with pre-composed bilingual message (`Vanakkam <name>, your order <order_no>...`) and courier tracking links.
- **Live Updates**: SWR with 10-second polling and refresh-on-focus for multi-device sync without manual page reloads.
- **Security**: Signed JWT session cookies (`jose`), bcrypt password hashing, login brute-force rate-limiting and lockout protection, and mandatory password reset on first staff login.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database & ORM**: Neon Serverless PostgreSQL + Drizzle ORM (SQL migrations in `/drizzle`)
- **Authentication**: Signed HTTP-only session cookies with `jose` and `bcryptjs`
- **Data Fetching**: SWR (10s auto-refresh + revalidate-on-focus)
- **Visual Analytics**: Recharts (trend line charts & courier distribution donut charts)
- **Exports**: `xlsx` (Excel) + `jspdf` & `jspdf-autotable` (PDF)
- **Hosting**: Deployed on Vercel Serverless Functions

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js (v18 or higher, v22 recommended)
- npm or pnpm

### 2. Installation
```bash
git clone <your-repo-url>
cd "sms courier"
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Database connection string (from Neon Postgres)
# If omitted during local testing, the app automatically runs on local data store
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Secret key for signing session JWT tokens
AUTH_SECRET="sri-mahadevaiyer-sweets-madurai-secret-key-1946-diwali-special"
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Default Credentials

| Role | Username | Temporary Password | Permissions |
|---|---|---|---|
| **Owner** | `owner` | `Admin@1946` | Full admin & financial reports access |
| **Staff** | `staff` | `Staff@1946` | Orders, dispatch, tracking, WhatsApp |

---

## 👥 How to Add Staff Accounts
1. Log in with the **Owner** account (`owner`).
2. In the top navigation menu, click **Users & Staff** (`/users`).
3. Click the **+ Create Staff User** button.
4. Enter the staff member's Full Name, Username, and a temporary password.
5. Click **Create Account**.
6. When the staff member signs in for the first time, the system will automatically force them to choose a secure personal password.

---

## 💾 How to Back Up the Database

### Method 1: Using `pg_dump` CLI (Neon / PostgreSQL)
```bash
pg_dump "$DATABASE_URL" -F c -b -v -f sms_madurai_backup_$(date +%Y%m%d).dump
```

### Method 2: From the Neon Console (Vercel Marketplace)
1. Open your [Vercel Dashboard](https://vercel.com).
2. Go to your Project -> **Storage** tab.
3. Click on your **Neon Postgres** database.
4. Navigate to **Branches / Backups** and click **Create Point-in-Time Snapshot**.

### Method 3: One-Click Excel / PDF Export
1. Log in as **Owner**.
2. Go to **Orders** or **Reports**.
3. Click **Export to Excel** or **Export to PDF** to download an immediate offline snapshot.

---

## 🌐 Deploying to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Sri Mahadevaiyer Sweets Order & Courier System"
   git remote add origin <github-repo-url>
   git push -u origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select the repository.
   - Framework preset: **Next.js**.
3. **Provision Neon Postgres Database**:
   - In Vercel Project settings -> **Storage**, add **Neon Postgres** from Marketplace.
   - Vercel will automatically inject `DATABASE_URL` into your environment variables.
4. **Add `AUTH_SECRET`**:
   - In Vercel -> Project Settings -> **Environment Variables**, add `AUTH_SECRET` with a long random key.
5. **Run Migrations & Seed**:
   ```bash
   npm run db:push
   npm run db:seed
   ```
6. **Set Serverless Region**:
   - Set serverless functions region to Mumbai (`bom1`) for lowest latency in Tamil Nadu.
