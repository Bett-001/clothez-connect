# Clotz Hub

Clotz Hub is a multi-store clothing marketplace. Shoppers browse independent clothing shops for men, women and kids, pick a store, fill a cart and check out. Each store owner runs their shop end to end: store profile, products and stock, orders, delivery and payment.

## Features

**Shoppers**
- Browse stores by department, town or name, with location, opening hours, delivery terms and reviews.
- Browse and search all products, filtered by department, type and price.
- One cart across many stores. Checkout creates one order per store.
- Delivery or in-store pickup, paid with M-Pesa (to the store's own till or paybill) or cash.
- Order history with live status tracking, M-Pesa code submission and cancellation.
- Store reviews, open to customers with a delivered order.

**Store owners**
- Store profile with logo, banner, departments, address, map link, hours, WhatsApp, delivery fees and payment details.
- Products with photo uploads, sizes, colours, stock, brand and material. Stock goes down automatically with each order and comes back on cancellation.
- Order management: confirm, prepare, ship or ready for pickup, deliver, verify payment and message the customer.
- Overview of new orders, payments to verify, revenue and low stock.

**Admins**
- Approve, reject, suspend and feature stores.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query and Supabase (Postgres, Auth and Storage).

## Getting started

You need Node.js 18 or newer and a Supabase project.

```sh
npm install
npm run dev
```

The app runs at http://localhost:8080.

### Environment variables

Create a `.env` file in the project root:

```sh
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-KEY
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-ID
```

Find these under Project Settings, then API, in the Supabase dashboard.

### Database setup

Run every file in `supabase/migrations` in filename order. Either paste each one into the Supabase SQL editor, or use the Supabase CLI:

```sh
npx supabase link --project-ref YOUR-PROJECT-ID
npx supabase db push
```

### Make yourself an admin

Sign up in the app, then run this in the SQL editor:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com';
```

Sign out and back in, and an Admin link appears in your account menu.

### Demo data (optional)

`supabase/seed-demo.sql` adds four sample stores with products. Change the email at the top to an account you have signed up with, then run the file in the SQL editor.

## How payments work

M-Pesa payments go straight from the shopper to the store's own till or paybill. After paying, the shopper enters the M-Pesa confirmation code on their order. The store owner checks it against their M-Pesa statement and marks the order as paid. Cash orders are marked paid by the store on delivery or pickup.

Automatic M-Pesa STK push and card payments are not built in. They need a payment provider account, such as Safaricom Daraja or Paystack, and a server-side function to hold the provider keys.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code with ESLint |
