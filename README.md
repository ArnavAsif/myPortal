# University of Development Alternative (UODA) — Certificate Verification Portal & Admin Panel

A high-performance, mobile-responsive certificate verification portal and administration dashboard built with the latest **Next.js (App Router, Turbopack)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## 🚀 Key Features

### 1. 🔍 Public Verification Portal (`/` & `/uoda`)
- **Pixel-Perfect UI**: Exactly replicates the UODA verification interface from the reference video and screenshot.
- **Dynamic Search**: Instant student ID lookup with real-time loading feedback ("Checking...").
- **Error State**: Shows the exact styled error notice (*"No certificate found for that number. Please check it and try again."*) when an invalid ID is provided.
- **Conditional Field Display**: As requested, **data only shows if it exists**—any empty or omitted fields are automatically hidden.
- **Verified Record Display**:
  - Green verified badge (*"Certificate verified - This record was found in our official register."*)
  - Student passport photograph
  - Verified details grid (Student Name, Date of Birth, Student ID, Registration Number, Father's Name, Mother's Name, Major Subject, CGPA, Issue Date)
- **Certificate Document & Download**:
  - High-resolution certificate preview with full-screen zoom modal
  - **"Download PDF"** button that downloads an official PDF copy
- **Animated Announcement Ticker**: Smooth, infinite marquee banner.
- **Contact Us Modal**: Fast popup with university address, phone numbers, and official email.

### 2. 🛡️ Admin Dashboard (`/admin/dashboard`)
- **Admin Authentication (`/admin/login`)**: Secure sign-in (Default: `admin@uoda.edu.bd` / `admin123`).
- **Real-Time Overview**: Total certificates count, active degree programs, and system status metrics.
- **Search & Filter Table**: Filter certificates by student name, ID, registration number, or degree with instant 1-click ID copy.
- **Add New Certificate (`/admin/certificates/new`)**:
  - Full student details form
  - Image file uploader for student passport photo (with instant preview)
  - Certificate image / PDF uploader (with instant preview)
  - Live portal preview mode directly within the admin screen
- **Edit Certificate (`/admin/certificates/[id]/edit`)**: Update any record or replace documents with instant sync.
- **Delete Certificate**: Modal confirmation with safety checks to remove records from registry.

### 3. ⚡ Supabase Integration & Dual-Layer Storage
- Pre-configured with the provided Supabase project credentials in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`: `https://qxyanvmriugmmbjygcmr.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_GP9I-8EbVGfISPoNReWmzQ_loZjqTH7`
- Client & Server utilities created in `@/utils/supabase/` using `@supabase/ssr`.
- Built-in fail-safe dual-layer storage: App immediately runs out of the box with sample records (Tania Akter: `789107238548`).
- Dedicated **Supabase Settings (`/admin/settings`)** page with live connection tester and 1-click SQL copy.

---

## 📋 Quick Start

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/uoda](http://localhost:3000/uoda) in your browser.

### 2. Test Verification
- **Valid ID**: Enter `789107238548` and click **Verify** to see Tania Akter's verified record, photo, certificate, and PDF download.
- **Invalid ID**: Enter any invalid ID like `789107238547` to test the not-found notification banner.

### 3. Access Admin Panel
- **URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Email**: `admin@uoda.edu.bd`
- **Password**: `admin123`

---

## 🗄️ Supabase SQL Setup (1-Time)

To connect your Supabase Postgres database:
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/qxyanvmriugmmbjygcmr/sql).
2. Copy and run the script located at [supabase/schema.sql](file:///D:/project-react/myportal/supabase/schema.sql) (or from the Admin Settings tab).
3. The table `certificates` will be created with indexing and public read policies.

---

## 📱 Mobile Responsiveness
All pages (public search portal, verified cards, certificate viewer, and admin dashboard) are fully optimized for mobile devices, tablets, and desktops.
