# Account Book

A collaborative account book app for tracking credits and debits across shared workspaces. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- Authentication (sign up / sign in) via Supabase Auth
- Create and manage workspaces
- Invite team members via invite code
- Role-based access: owner, editor, viewer
- Add credit/debit entries with payment mode, description, and date
- Attach links to entries
- Activity log per workspace
- Realtime updates

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + RLS)
- **Styling**: Tailwind CSS v4
- **Data fetching**: TanStack Query v5
- **Icons**: Lucide React

## Local Development

### 1. Clone and install

```bash
git clone <repo-url>
cd account-book
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project values in `.env.local`. Find these in your Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

Run the full schema in the **Supabase SQL Editor**:

```
supabase/schema.sql
```

This creates all tables, RLS policies, triggers, and functions from a clean state. It is safe to re-run.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in **Vercel → Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── (auth)/         # Login & signup pages
│   ├── (app)/          # Protected app pages (dashboard, workspace)
│   └── join/[code]/    # Invite link handler
├── components/         # UI and feature components
├── hooks/              # React Query hooks (workspace, entries)
├── lib/supabase/       # Supabase client + middleware
└── types/              # TypeScript types
supabase/
└── schema.sql          # Full database schema (run this in Supabase)
```
